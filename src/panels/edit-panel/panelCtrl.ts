/**
 * File: panelCtrl.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-02-19
 * Description: Main control panel of the app plugin, handles configuration and data import
 */

import { MetricsPanelCtrl } from 'grafana/app/plugins/sdk';

import _ from 'lodash';
import $ from 'jquery';

import { SeriesWrapper } from './plotly/SeriesWrapper';
import { EditorHelper } from './plotly/editor';

import { loadPlotly } from './plotly/libLoader';
import { AnnoInfo } from './plotly/anno';

import { PanelEvents } from '@grafana/data';
import { PlotlyPanelUtil } from './plotly/PlotlyPanelUtil';

const alertSuccess = 'alert-success';

export class PlotlyPanelCtrl extends MetricsPanelCtrl {
  static templateUrl = 'panels/edit-panel/partials/module.html';

  Plotly: any; // Loaded dynamically!

  initialized: boolean;

  graphDiv: any;
  annotations = new AnnoInfo();
  series: SeriesWrapper[];
  seriesByKey: Map<string, SeriesWrapper> = new Map();
  seriesHash = '?';

  traces: any[]; // The data sent directly to Plotly -- with a special __copy element
  layout: any; // The layout used by Plotly

  mouse: any;
  cfg: any;

  // For editor
  editor: EditorHelper;
  dataWarnings: string[]; // warnings about loading data

  /** @ngInject */
  constructor($scope, $injector, $window, private readonly $rootScope, public uiSegmentSrv, private readonly annotationsSrv) {
    super($scope, $injector);
    this.$rootScope = $rootScope;
    this.uiSegmentSrv = uiSegmentSrv;
    this.annotationsSrv = annotationsSrv;

    this.initialized = false;

    // defaults configs
    _.defaultsDeep(this.panel, PlotlyPanelUtil.defaults);

    this.cfg = this.panel.pconfig;

    this.traces = [];

    // ?? This seems needed for tests?!!
    if (!this.events) {
      return;
    }

    loadPlotly(this.cfg).then(v => {
      this.Plotly = v;
      console.log('Plotly', v);

      // Wait till plotly exists has loaded before we handle any data
      this.events.on(PanelEvents.render, this.onRender.bind(this));
      this.events.on(PanelEvents.dataReceived, this.onDataReceived.bind(this));
      this.events.on(PanelEvents.dataError, this.onDataError.bind(this));
      this.events.on(PanelEvents.panelSizeChanged, this.onResize.bind(this));
      this.events.on(PanelEvents.dataSnapshotLoad, this.onDataSnapshotLoad.bind(this));
      this.events.on(PanelEvents.refresh, this.onRefresh.bind(this));

      // force to render the panel after plotly is loaded
      this.onInitEditMode();
    });

    // Standard handlers
    this.events.on(PanelEvents.editModeInitialized, this.onInitEditMode.bind(this));
    this.events.on(PanelEvents.panelInitialized, this.onPanelInitialized.bind(this));
  }

  // Called only on import button click, if the import doesn't throw errors, it reset the saved data
  async upload_button_click(net: any) {
    await this.onUpload(net);
  }

  // Called on import button click but also to re-load a saved network
  async onUpload(net: any) {
    this.panel.jsonContent = JSON.stringify(net, null, '\t');
    this.$rootScope.appEvent(alertSuccess, ['File Json Caricato']);
  }

  async delete_json_click() {
    this.panel.jsonContent = null;
    this.$rootScope.appEvent(alertSuccess, ['File Json Cancellato']);
  }

  onResize() {
    if (this.graphDiv && this.layout && this.Plotly) {
      PlotlyPanelUtil.doResize(this); // Debounced
    }
  }

  onDataError(err) {
    this.series = [];
    this.annotations.clear();
    this.render();
  }

  onRefresh() {
    // ignore fetching data if another panel is in fullscreen
    if (this.otherPanelInFullscreenMode()) {
      return;
    }

    if (this.graphDiv && this.initialized && this.Plotly) {
      this.Plotly.redraw(this.graphDiv);
    }
  }

  onInitEditMode() {
    if (!this.editor) {
      this.editor = new EditorHelper(this);
      this.addEditorTab('Import JSON', 'public/plugins/grafana-prediction-plugin/panels/edit-panel/partials/importJson.html', 2);
      this.addEditorTab('Display', 'public/plugins/grafana-prediction-plugin/panels/edit-panel/plotly/partials/tab_display.html', 3);
      this.addEditorTab('Traces', 'public/plugins/grafana-prediction-plugin/panels/edit-panel/plotly/partials/tab_traces.html', 4);

      PlotlyPanelUtil.onConfigChanged(this); // Sets up the axis info
    }
  }

  onPanelInitialized() {
    if (!this.panel.version || PlotlyPanelUtil.configVersion > this.panel.version) {
      PlotlyPanelUtil.processConfigMigration(this);
    }

    PlotlyPanelUtil._updateTraceData(this, true);
  }

  onRender() {
    // ignore fetching data if another panel is in fullscreen
    if (this.otherPanelInFullscreenMode() || !$('#plotly-spot').length) {
      return;
    }

    if (!this.Plotly) {
      return;
    }

    PlotlyPanelUtil.renderPlotly(this, this.$rootScope);
  }

  onDataSnapshotLoad(snapshot) {
    this.onDataReceived(snapshot);
  }

  _hadAnno = false;

  onDataReceived(dataList) {
    PlotlyPanelUtil.plotlyDataReceived(this, dataList, this.annotationsSrv);
  }

  link(scope, elem, attrs, ctrl) {
    this.graphDiv = elem.find('#plotly-spot')[0];
    this.initialized = false;
    elem.on('mousemove', evt => {
      this.mouse = evt;
    });
  }
}
