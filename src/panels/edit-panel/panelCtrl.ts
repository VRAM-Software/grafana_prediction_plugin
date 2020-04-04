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

export class PlotlyPanelCtrl extends MetricsPanelCtrl {
  static predictionSettingsVersion = 1;
  static templateUrl = 'panels/edit-panel/partials/module.html';
  static predictionPanelDefaults = {
    predictionSettings: {
      version: null,
      json: null,
      nodeMap: [],
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
  async upload_button_click(net: any) {
    await this.onUpload(net);
  }

  // Called on import button click but also to re-load a saved json
  async onUpload(net: any) {
    this.panel.predictionSettings.json = JSON.stringify(net);
    this.publishAppEvent(AppEvents.alertSuccess, ['File Json Caricato']);
  }

  async delete_json_click() {
    this.predictionPanelConfig.json = null;
    this.publishAppEvent(AppEvents.alertSuccess, ['File Json Cancellato']);
  }

  async change_query_association(query: any, selectedP: any) {
    this.panel.predictionSettings.nodeMap[query.id] = selectedP;
    //console.log(this.panel.predictionSettings.nodeMap);
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

      this.panel.predictionSettings.predittori = ['cpu', 'hdd', 'fan'];

      this.addEditorTab('Select query associations', 'public/plugins/grafana-prediction-plugin/panels/edit-panel/partials/nodemap.html', 3);

      this.plotlyPanelUtil.plotlyOnInitEditMode(3);
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
    this.plotlyPanelUtil.plotlyDataReceived(dataList, this.annotationsSrv);
    // per influxDB il nome del campo potrebbe essere name anziché alias
    this.panel.predictionSettings.query = dataList.map(a => {
      return { id: a.refId, name: a.alias };
    });
  }

  link(scope, elem, attrs, ctrl) {
    this._graphDiv = elem.find('#plotly-spot')[0];
    this.plotlyPanelUtil.initialized = false;
  }
}
