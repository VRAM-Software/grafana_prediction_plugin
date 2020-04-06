/**
 * File: panelCtrl.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-02-19
 * Description: Main control panel of the app plugin, handles configuration and data import
 */

import { MetricsPanelCtrl } from 'grafana/app/plugins/sdk';

import _ from 'lodash';
import $ from 'jquery';

import { AppEvents, PanelEvents } from '@grafana/data';
import { PlotlyPanelUtil } from './plotly/PlotlyPanelUtil';
import { SelectInfluxDBDirective } from './selectInfluxDBTab';

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
      writeDatasourceID: '',
      influxHost: '',
      influxPort: '',
      influxDatabase: '',
      influxMeasurement: '',
      influxFieldKey: '',
    },
  };
  plotlyPanelUtil: PlotlyPanelUtil;
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

    // ?? This seems needed for tests?!!
    if (!this.events) {
      return;
    }

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
    this.panel.predictionSettings.json = JSON.stringify(net);
    this.panel.predictionSettings.predictors = net.predictors.map((a, index) => {
      return { id: index, name: a };
    });
    this.publishAppEvent(AppEvents.alertSuccess, ['File Json Caricato']);
    //TODO: call controller setConfiguration()
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
      controllerMap.set(predictor.name, this.panel.predictionSettings.nodeMap[predictor.id]);
    });

    //TODO: call controller setNodeMap()
    console.log('BUILDED MAP', controllerMap);
  }

  updateQueries(dataList) {
    const updatedQueries = dataList.map(a => {
      return { target: a.target };
    });

    if (!this.compareQueriesList(this.panel.predictionSettings.queries, updatedQueries)) {
      this.panel.predictionSettings.nodeMap = [];
      this.panel.predictionSettings.queries = _.cloneDeep(updatedQueries);
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
    this.updateQueries(dataList);
    console.log('DATALIST', dataList);
    this.plotlyPanelUtil.plotlyDataReceived(dataList, this.annotationsSrv);
    //TODO: call controller setDataList()
  }

  link(scope, elem, attrs, ctrl) {
    this._graphDiv = elem.find('#plotly-spot')[0];
    this.plotlyPanelUtil.initialized = false;
  }
}
