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
      nodeMap: [],
      writeDatasourceID: '',
      influxHost: '',
      influxPort: '',
      influxDatabase: '',
      influxMeasurement: '',
      influxFieldKey: '',
    },
  };
  queryList: any[];
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
  async upload_button_click(net: any) {
    await this.onUpload(net);
  }

  // Called on import button click but also to re-load a saved json
  async onUpload(net: any) {
    this.panel.predictionSettings.json = JSON.stringify(net);
    this.publishAppEvent(AppEvents.alertSuccess, ['File Json Caricato']);
    this.panel.predictionSettings.predictors = net.Predictors.map((a, index) => {
      return { id: index, name: a };
    });
  }

  async delete_json_click() {
    this.predictionPanelConfig.json = null;
    this.publishAppEvent(AppEvents.alertSuccess, ['File Json Cancellato']);
    this.panel.predictionSettings.predictors = null;
  }

  async update_queries() {
    this.panel.predictionSettings.query = _.clone(
      this.queryList.map(a => {
        return { id: a.refId, name: a.alias };
      })
    );
    // comportamento anomalo: cancella la nodeMap, a causa dell'interfaccia angular
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
    this.queryList = dataList;
    this.plotlyPanelUtil.plotlyDataReceived(dataList, this.annotationsSrv);
  }

  link(scope, elem, attrs, ctrl) {
    this._graphDiv = elem.find('#plotly-spot')[0];
    this.plotlyPanelUtil.initialized = false;
  }
}
