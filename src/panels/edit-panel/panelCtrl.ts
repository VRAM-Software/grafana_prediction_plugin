/**
 * File: panelCtrl.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-02-19
 * Description: Main control panel of the app plugin, handles configuration and data import
 */

import _ from 'lodash';
import $ from 'jquery';
import { MetricsPanelCtrl } from 'grafana/app/plugins/sdk';
import { AppEvents, PanelEvents } from '@grafana/data';
import { PlotlyPanelUtil } from './plotly/PlotlyPanelUtil';
// @ts-ignore
import { SelectInfluxDBDirective } from './selectInfluxDBTab';
import { ProcessData } from '../../controller/ProcessData';

export class PlotlyPanelCtrl extends MetricsPanelCtrl {
  static predictionSettingsVersion = 1;
  static templateUrl = 'panels/edit-panel/partials/module.html';
  static predictionPanelDefaults = {
    predictionSettings: {
      version: null,
      json: null,
      predictors: [],
      queries: [],
      nodeMap: [],
      savedWriteConnections: false,
      writeDatasourceID: '',
      influxHost: '',
      influxPort: '',
      influxDatabase: '',
      influxMeasurement: '',
      influxFieldKey: '',
    },
  };
  plotlyPanelUtil: PlotlyPanelUtil;
  private readonly processData: ProcessData;
  private _graphDiv: any;
  private predictionPanelConfig: any;

  /** @ngInject */
  constructor($scope, $injector, $window, private readonly $rootScope, public uiSegmentSrv, private readonly annotationsSrv) {
    super($scope, $injector);
    this.$rootScope = $rootScope;
    this.uiSegmentSrv = uiSegmentSrv;
    this.annotationsSrv = annotationsSrv;
    // defaults configs
    let defaults = _.cloneDeep(PlotlyPanelCtrl.predictionPanelDefaults);
    defaults = _.merge(defaults, PlotlyPanelUtil.defaults);
    _.defaultsDeep(this.panel, defaults);

    this.predictionPanelConfig = this.panel.predictionSettings;
    this.plotlyPanelUtil = new PlotlyPanelUtil(this);
    this.processData = new ProcessData();

    this.events.on(PanelEvents.render, this.onRender.bind(this));
    this.events.on(PanelEvents.dataReceived, this.onDataReceived.bind(this));
    this.events.on(PanelEvents.dataError, this.onDataError.bind(this));
    this.events.on(PanelEvents.panelSizeChanged, this.onResize.bind(this));
    this.events.on(PanelEvents.dataSnapshotLoad, this.onDataSnapshotLoad.bind(this));
    this.events.on(PanelEvents.refresh, this.onRefresh.bind(this));

    // force to render the panel after plotly is loaded
    this.onInitEditMode();

    // Standard handlers
    this.events.on(PanelEvents.editModeInitialized, this.onInitEditMode.bind(this));
    this.events.on(PanelEvents.panelInitialized, this.onPanelInitialized.bind(this));

    this.initializeController();
  }

  private initializeController() {
    // configuration
    if (this.panel.predictionSettings.json) {
      let net = JSON.parse(this.panel.predictionSettings.json);
      this.processData.setConfiguration({
        pluginAim: net.pluginAim,
        predictors: net.predictors,
        result: net.result,
        notes: net.notes,
      });
    }

    // Influx
    if (this.panel.predictionSettings.savedWriteConnections) {
      this.processData.setInfluxParameters({
        host: this.panel.predictionSettings.influxHost,
        port: this.panel.predictionSettings.influxPort,
        database: this.panel.predictionSettings.influxDatabase,
        credentials: ['', ''],
        measurement: this.panel.predictionSettings.influxMeasurement,
        fieldKey: this.panel.predictionSettings.influxFieldKey,
      });
    }

    // nodeMap
    if (this.panel.predictionSettings.nodeMap && this.panel.predictionSettings.nodeMap.length > 0) {
      const controllerMap = new Map();

      this.panel.predictionSettings.predictors.forEach(predictor => {
        controllerMap.set(this.panel.predictionSettings.nodeMap[predictor.id], predictor.name);
      });

      this.processData.setNodeMap(controllerMap);
    }
  }

  get graphDiv(): any {
    return this._graphDiv;
  }

  // Called only on import button click, if the import doesn't throw errors, it reset the saved data
  async uploadButtonClick(net: any) {
    await this.onUpload(net);
  }

  // Called on import button click but also to re-load a saved json
  async onUpload(net: any) {
    if (net.author === 'VRAMSoftware') {
      this.panel.predictionSettings.json = JSON.stringify(net);
      this.panel.predictionSettings.predictors = net.predictors.map((a, index) => {
        return { id: index, name: a };
      });
      this.processData.setConfiguration({
        pluginAim: net.pluginAim,
        predictors: net.predictors,
        result: net.result,
        notes: net.notes,
      });
      this.onChange();
      this.publishAppEvent(AppEvents.alertSuccess, ['File Json Caricato']);
    } else {
      this.publishAppEvent(AppEvents.alertError, ['Invalid JSON configuration file!', 'JSON not recognized as a legal configuration file']);
    }
  }

  async deleteJsonClick() {
    this.predictionPanelConfig.json = null;
    this.panel.predictionSettings.predictors = null;
    this.panel.predictionSettings.nodeMap = [];
    this.publishAppEvent(AppEvents.alertSuccess, ['File Json Cancellato']);
  }

  async confirmQueries() {
    // TODO: check that the select does not have the same data
    const controllerMap = new Map();

    this.panel.predictionSettings.predictors.forEach(predictor => {
      if (controllerMap.has(this.panel.predictionSettings.nodeMap[predictor.id])) {
        this.publishAppEvent(AppEvents.alertError, ['Predictor to query map contains errors!', 'Predictors must map to different queries']);
        return;
      } else {
        controllerMap.set(this.panel.predictionSettings.nodeMap[predictor.id], predictor.name);
      }
    });

    this.publishAppEvent(AppEvents.alertSuccess, ['Query association correctly set!']);
    this.processData.setNodeMap(controllerMap);
    this.onChange();
  }

  async confirmDatabaseSettings() {
    this.processData.setInfluxParameters({
      host: this.panel.predictionSettings.influxHost,
      port: this.panel.predictionSettings.influxPort,
      database: this.panel.predictionSettings.influxDatabase,
      credentials: ['', ''],
      measurement: this.panel.predictionSettings.influxMeasurement,
      fieldKey: this.panel.predictionSettings.influxFieldKey,
    });

    this.onChange();
  }

  updateQueries(dataList) {
    const updatedQueries = dataList.map(a => {
      return { target: a.target };
    });

    if (!this.compareQueriesList(this.panel.predictionSettings.queries, updatedQueries)) {
      this.panel.predictionSettings.nodeMap = [];
      this.panel.predictionSettings.queries = updatedQueries;
    }
  }

  private compareQueriesList(query1, query2): boolean {
    if (query1.length !== query2.length) {
      return false;
    }

    for (let i = 0; i < query1.length; ++i) {
      if (query1[i].target !== query2[i].target) {
        return false;
      }
    }

    return true;
  }

  private onChange() {
    this.processData.start();
  }

  onResize() {
    if (this.graphDiv) {
      this.plotlyPanelUtil.plotlyOnResize();
    }
  }

  onDataError(err) {
    this.plotlyPanelUtil.plotlyOnDataError();
    this.render();
  }

  onRefresh() {
    // ignore fetching data if another panel is in fullscreen
    if (this.otherPanelInFullscreenMode()) {
      return;
    }

    if (this.graphDiv) {
      this.plotlyPanelUtil.plotlyOnRefresh(this.graphDiv);
    }
  }

  onInitEditMode() {
    if (!this.plotlyPanelUtil.isPlotlyEditModeLoaded()) {
      this.addEditorTab('Import JSON', 'public/plugins/grafana-prediction-plugin/panels/edit-panel/partials/importJson.html', 2);
      this.addEditorTab('Select query associations', 'public/plugins/grafana-prediction-plugin/panels/edit-panel/partials/nodemap.html', 3);
      this.addEditorTab('Configure influxDB destination', SelectInfluxDBDirective, 4);
      this.plotlyPanelUtil.plotlyOnInitEditMode(5);
      this.plotlyPanelUtil.onConfigChanged();
    }
  }

  onPanelInitialized() {
    if (!this.predictionPanelConfig.version || PlotlyPanelCtrl.predictionSettingsVersion > this.predictionPanelConfig.version) {
      // Process migration of settings
      this.panel.predictionSettings.version = PlotlyPanelCtrl.predictionSettingsVersion;
    }
    this.plotlyPanelUtil.plotlyOnPanelInitialized();
  }

  onRender() {
    // ignore fetching data if another panel is in fullscreen
    if (this.otherPanelInFullscreenMode() || !$('#plotly-spot').length) {
      return;
    }

    this.plotlyPanelUtil.plotlyOnRender(this.$rootScope);
  }

  onDataSnapshotLoad(snapshot) {
    this.onDataReceived(snapshot);
  }

  onDataReceived(dataList) {
    console.log('DATALIST', dataList);
    this.updateQueries(dataList);
    this.plotlyPanelUtil.plotlyDataReceived(dataList, this.annotationsSrv);
    this.processData.setDataList(dataList);
    this.onChange();
  }

  link(scope, elem, attrs, ctrl) {
    this._graphDiv = elem.find('#plotly-spot')[0];
    this.plotlyPanelUtil.initialized = false;
  }
}
