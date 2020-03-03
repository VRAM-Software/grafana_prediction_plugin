import _ from 'lodash';
import { PanelEvents } from '@grafana/data';
import { MetricsPanelCtrl } from 'grafana/app/plugins/sdk';
import appEvents from 'grafana/app/core/app_events';

import Plotly from 'plotly.js';

export class StatusPluginCtrl extends MetricsPanelCtrl {
  static templateUrl = 'panels/edit-panel/partials/panelTemplate.html';
  static scrollable = true;

  message: string;
  graphArea: any;
  private seriesList: any;
  cfg: any;
  initialized: boolean;
  mouse: any;

  panelDefaults = {
    jsonContent: '',
    secondToRefresh: 5,
  };

  /** @ngInject */
  constructor($scope: any, $injector: any) {
    super($scope, $injector);
    _.defaults(this.panel, this.panelDefaults);

    this.message = 'Loading data...';
    this.initialized = false;
    this.cfg = this.panel.pconfig;

    this.events.on(PanelEvents.dataReceived, this.onDataReceived.bind(this));
    this.events.on(PanelEvents.render, this.onRender.bind(this));
    this.events.on(PanelEvents.refresh, this.onRefresh.bind(this));

    // Refresh after plotly is loaded
    this.refresh();

    this.events.on(PanelEvents.editModeInitialized, this.onInitEditMode.bind(this));
  }

  onInitEditMode() {
    this.addEditorTab('Import JSON', 'public/plugins/grafana-prediction-plugin/panels/edit-panel/partials/importJson.html', 2);
  }

  // Called only on import button click, if the import doesn't throw errors, it reset the saved data
  async upload_button_click(net: any) {
    await this.onUpload(net);
  }

  // Called on import button click but also to re-load a saved network
  async onUpload(net: any) {
    this.panel.jsonContent = JSON.stringify(net, null, '\t');
    appEvents.emit('alert-success', ['File Json Caricato']);
  }

  async delete_json_click() {
    this.panel.jsonContent = null;
    appEvents.emit('alert-success', ['File Json Cancellato']);
  }

  onRefresh() {
    // ignore fetching data if another panel is in fullscreen
    if (this.otherPanelInFullscreenMode()) {
      return;
    }

    if (this.graphArea && this.initialized && Plotly) {
      Plotly.redraw(this.graphArea);
    }
  }

  onRender() {
    this.message = this.seriesList[0].alias + ' :';
    if (!Plotly) {
      return;
    }
    const x = new Array();
    const y = new Array();

    for (let i = 0; i < this.seriesList[0].datapoints.length; i++) {
      x[i] = this.seriesList[0].datapoints[i][1];
      y[i] = this.seriesList[0].datapoints[i][0];
    }

    const trace1 = {
      x,
      y,
      type: 'scatter',
    };

    const data = [trace1];

    Plotly.newPlot(this.graphArea, data);
  }

  onDataReceived(data: any) {
    console.log(data);
    this.seriesList = data;
    this.render();
  }
}
