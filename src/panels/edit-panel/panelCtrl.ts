/**
 * File: panelCtrl.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-02-19
 * Description: Main control panel of the app plugin, handles configuration and data import
 */

import { MetricsPanelCtrl } from 'grafana/app/plugins/sdk';

import _ from 'lodash';
import { DateTime } from 'luxon';
import $ from 'jquery';

import { SeriesWrapper, SeriesWrapperSeries, SeriesWrapperTable, SeriesWrapperTableRow } from './plotly/SeriesWrapper';
import { EditorHelper } from './plotly/editor';

import { loadPlotly, loadIfNecessary } from './plotly/libLoader';
import { AnnoInfo } from './plotly/anno';
import { Axis } from 'plotly.js';
import { PanelEvents } from '@grafana/data';

let Plotly: any; // Loaded dynamically!

const alertSuccess = 'alert-success';

export class PlotlyPanelCtrl extends MetricsPanelCtrl {
  static templateUrl = 'panels/edit-panel/partials/module.html';
  static configVersion = 1; // An index to help config migration

  initialized: boolean;

  static defaultTrace = {
    mapping: {
      x: null,
      y: null,
      z: null,
      text: null,
      color: null,
      size: null,
    },
    show: {
      line: true,
      markers: true,
    },
    settings: {
      line: {
        color: '#005f81',
        width: 5,
        dash: 'solid',
        shape: 'linear',
      },
      marker: {
        size: 5,
        symbol: 'circle',
        color: '#33B5E5',
        colorscale: 'YlOrRd',
        sizemode: 'diameter',
        sizemin: 3,
        sizeref: 0.2,
        line: {
          color: '#DDD',
          width: 0,
        },
        showscale: false,
      },
      color_option: 'ramp',
    },
  };

  static yaxis2: Partial<Axis> = {
    title: 'Annotations',
    type: 'linear',
    range: [0, 1],
    visible: false,
  };

  static defaults = {
    pconfig: {
      loadFromCDN: false,
      showAnnotations: true,
      fixScale: '',
      traces: [PlotlyPanelCtrl.defaultTrace],
      settings: {
        type: 'scatter',
        displayModeBar: true,
      },
      layout: {
        showlegend: false,
        legend: {
          orientation: 'h',
        },
        dragmode: 'lasso', // (enumerated: "zoom" | "pan" | "select" | "lasso" | "orbit" | "turntable" )
        hovermode: 'closest',
        font: {
          family: '"Open Sans", Helvetica, Arial, sans-serif',
        },
        xaxis: {
          showgrid: true,
          zeroline: false,
          type: 'auto',
          rangemode: 'normal', // (enumerated: "normal" | "tozero" | "nonnegative" )
        },
        yaxis: {
          showgrid: true,
          zeroline: false,
          type: 'linear',
          rangemode: 'normal', // (enumerated: "normal" | "tozero" | "nonnegative" ),
        },
        zaxis: {
          showgrid: true,
          zeroline: false,
          type: 'linear',
          rangemode: 'normal', // (enumerated: "normal" | "tozero" | "nonnegative" )
        },
      },
    },
  };

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

    this.initialized = false;

    // defaults configs
    _.defaultsDeep(this.panel, PlotlyPanelCtrl.defaults);

    this.cfg = this.panel.pconfig;

    this.traces = [];

    // ?? This seems needed for tests?!!
    if (!this.events) {
      return;
    }

    loadPlotly(this.cfg).then(v => {
      Plotly = v;
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

  getCssRule(selectorText): CSSStyleRule | null {
    const styleSheets = Array.from(document.styleSheets);
    for (const idx of styleSheets) {
      const styleSheet = idx as CSSStyleSheet;
      const rules = Array.from(styleSheet.cssRules);
      for (const ruleIdx of rules) {
        const rule = ruleIdx as CSSStyleRule;
        if (rule.selectorText === selectorText) {
          return rule;
        }
      }
    }
    return null;
  }

  getPanelHeight() {
    // panel can have a fixed height set via "General" tab in panel editor
    let tmpPanelHeight = this.panel.height;
    if (typeof tmpPanelHeight === 'undefined' || tmpPanelHeight === '') {
      // grafana also supplies the height, try to use that if the panel does not have a height
      tmpPanelHeight = String(this.height);
      // v4 and earlier define this height, detect span for pre-v5
      if (typeof this.panel.span !== 'undefined') {
        // if there is no header, adjust height to use all space available
        var panelTitleOffset = 20;
        if (this.panel.title !== '') {
          panelTitleOffset = 42;
        }
        tmpPanelHeight = String(this.containerHeight - panelTitleOffset); // offset for header
      }
      if (typeof tmpPanelHeight === 'undefined') {
        // height still cannot be determined, get it from the row instead
        tmpPanelHeight = this.row.height;
        if (typeof tmpPanelHeight === 'undefined') {
          // last resort - default to 250px (this should never happen)
          tmpPanelHeight = '250';
        }
      }
    }
    // replace px
    tmpPanelHeight = tmpPanelHeight.replace('px', '');
    // convert to numeric value
    return parseInt(tmpPanelHeight, 10);
  }

  // Don't call resize too quickly
  doResize = _.debounce(() => {
    // https://github.com/alonho/angular-plotly/issues/26
    const e = window.getComputedStyle(this.graphDiv).display;
    if (!e || 'none' === e) {
      // not drawn!
      console.warn('resize a plot that is not drawn yet');
    } else {
      const rect = this.graphDiv.getBoundingClientRect();
      this.layout.width = rect.width;
      this.layout.height = this.getPanelHeight();

      Plotly.redraw(this.graphDiv);
    }
  }, 50);

  onResize() {
    if (this.graphDiv && this.layout && Plotly) {
      this.doResize(); // Debounced
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

    if (this.graphDiv && this.initialized && Plotly) {
      Plotly.redraw(this.graphDiv);
    }
  }

  onInitEditMode() {
    if (!this.editor) {
      this.editor = new EditorHelper(this);
      this.addEditorTab('Import JSON', 'public/plugins/grafana-prediction-plugin/panels/edit-panel/partials/importJson.html', 2);
      this.addEditorTab('Display', 'public/plugins/grafana-prediction-plugin/panels/edit-panel/plotly/partials/tab_display.html', 3);
      this.addEditorTab('Traces', 'public/plugins/grafana-prediction-plugin/panels/edit-panel/plotly/partials/tab_traces.html', 4);

      this.onConfigChanged(); // Sets up the axis info
    }
  }

  processConfigMigration() {
    console.log(`Migrating Plotly Configuration to version: ${PlotlyPanelCtrl.configVersion}`);

    // Remove some things that should not be saved
    const cfg = this.panel.pconfig;
    delete cfg.layout.plot_bgcolor;
    delete cfg.layout.paper_bgcolor;
    delete cfg.layout.autosize;
    delete cfg.layout.height;
    delete cfg.layout.width;
    delete cfg.layout.margin;
    delete cfg.layout.scene;
    if (!this.is3d()) {
      delete cfg.layout.zaxis;
    }

    // Move from 'markers-lines' to checkbox
    if (cfg.settings.mode) {
      const old = cfg.settings.mode;
      const show = {
        markers: old.indexOf('markers') >= 0,
        lines: old.indexOf('lines') >= 0,
      };
      _.forEach(cfg.traces, trace => {
        trace.show = show;
      });
      delete cfg.settings.mode;
    }

    console.log('After Migration:', cfg);
    this.cfg = cfg;
    this.panel.version = PlotlyPanelCtrl.configVersion;
  }

  onPanelInitialized() {
    if (!this.panel.version || PlotlyPanelCtrl.configVersion > this.panel.version) {
      this.processConfigMigration();
    }
    this._updateTraceData(true);
  }

  deepCopyWithTemplates = obj => {
    if (_.isArray(obj)) {
      return obj.map(val => this.deepCopyWithTemplates(val));
    } else if (_.isString(obj)) {
      return this.templateSrv.replace(obj, this.panel.scopedVars);
    } else if (_.isObject(obj)) {
      const copy = {};
      _.forEach(obj, (v, k) => {
        copy[k] = this.deepCopyWithTemplates(v);
      });
      return copy;
    }
    return obj;
  };

  getProcessedLayout() {
    // Copy from config
    const layout = this.deepCopyWithTemplates(this.cfg.layout);
    layout.plot_bgcolor = 'transparent';
    layout.paper_bgcolor = layout.plot_bgcolor;

    // Update the size
    const rect = this.graphDiv.getBoundingClientRect();
    layout.autosize = false; // height is from the div
    layout.height = this.getPanelHeight();
    layout.width = rect.width;

    // Make sure it is something
    if (!layout.xaxis) {
      layout.xaxis = {};
    }
    if (!layout.yaxis) {
      layout.yaxis = {};
    }

    // Fixed scales
    if (this.cfg.fixScale) {
      if ('x' === this.cfg.fixScale) {
        layout.yaxis.scaleanchor = 'x';
      } else if ('y' === this.cfg.fixScale) {
        layout.xaxis.scaleanchor = 'y';
      } else if ('z' === this.cfg.fixScale) {
        layout.xaxis.scaleanchor = 'z';
        layout.yaxis.scaleanchor = 'z';
      }
    }

    if (this.is3d()) {
      if (!layout.zaxis) {
        layout.zaxis = {};
      }

      // 3d uses 'scene' for the axis
      layout.scene = {
        xaxis: layout.xaxis,
        yaxis: layout.yaxis,
        zaxis: layout.zaxis,
      };

      delete layout.xaxis;
      delete layout.yaxis;
      delete layout.zaxis;

      layout.margin = {
        l: 0,
        r: 0,
        t: 0,
        b: 5,
        pad: 0,
      };
    } else {
      delete layout.zaxis;
      delete layout.scene;

      // Check if the X axis should be a date
      if (!layout.xaxis.type || layout.xaxis.type === 'auto') {
        const mapping = _.get(this.cfg, 'traces[0].mapping.x');
        if (mapping && mapping.indexOf('time') >= 0) {
          layout.xaxis.type = 'date';
        }
      }

      const isDate = layout.xaxis.type === 'date';
      layout.margin = {
        l: layout.yaxis.title ? 50 : 35,
        r: 5,
        t: 0,
        b: layout.xaxis.title ? 65 : isDate ? 40 : 30,
        pad: 2,
      };

      // Set the range to the query window
      if (isDate && !layout.xaxis.range) {
        const range = this.timeSrv.timeRange();
        layout.xaxis.range = [range.from.valueOf(), range.to.valueOf()];
      }

      // get the css rule of grafana graph axis text
      const labelStyle = this.getCssRule('div.flot-text');
      if (labelStyle) {
        let color = labelStyle.style.color;
        if (!layout.font) {
          layout.font = {};
        }
        layout.font.color = color;

        // make the grid a little more transparent
        color = $.color
          .parse(color)
          .scale('a', 0.22)
          .toString();

        // set gridcolor (like grafana graph)
        layout.xaxis.gridcolor = color;
        layout.yaxis.gridcolor = color;
      }

      // Set the second axis
      layout.yaxis2 = PlotlyPanelCtrl.yaxis2;
    }
    return layout;
  }

  onRender() {
    // ignore fetching data if another panel is in fullscreen
    if (this.otherPanelInFullscreenMode() || !$('#plotly-spot').length) {
      return;
    }

    if (!Plotly) {
      return;
    }

    if (!this.initialized) {
      const s = this.cfg.settings;

      const options = {
        showLink: false,
        displaylogo: false,
        displayModeBar: s.displayModeBar,
        modeBarButtonsToRemove: ['sendDataToCloud'], //, 'select2d', 'lasso2d']
      };

      this.layout = this.getProcessedLayout();
      this.layout.shapes = this.annotations.shapes;
      let traces = this.traces;
      if (this.annotations.shapes.length > 0) {
        traces = this.traces.concat(this.annotations.trace);
      }
      Plotly.react(this.graphDiv, traces, this.layout, options);

      this.graphDiv.on('plotly_click', data => {
        if (data === undefined || data.points === undefined) {
          return;
        }
        for (const i of data.points) {
          const idx = i.pointNumber;
          const ts = this.traces[0].ts[idx];
          const msg = `${i.x.toPrecision(4)}, ${i.y.toPrecision(4)}`;
          this.$rootScope.appEvent(alertSuccess, [msg, `@ ${this.dashboard.formatDate(DateTime.fromMillis(ts))}`]);
        }
      });

      this.graphDiv.on('plotly_selected', data => {
        if (data === undefined || data.points === undefined) {
          return;
        }

        if (data.points.length === 0) {
          console.log('Nothing Selected', data);
          return;
        }

        console.log('SELECTED', data);

        let min = Number.MAX_SAFE_INTEGER;
        let max = Number.MIN_SAFE_INTEGER;

        for (const i of data.points) {
          const found = i;
          const idx = found.pointNumber;
          const ts = found.fullData.x[idx];
          min = Math.min(min, ts);
          max = Math.max(max, ts);
        }

        // At least 2 seconds
        min -= 1000;
        max += 1000;

        const range = { from: DateTime.fromMillis(min, { zone: 'utc' }).toMillis(), to: DateTime.fromMillis(max, { zone: 'utc' }).toMillis() };

        console.log('SELECTED!!!', min, max, data.points.length, range);

        this.timeSrv.setTime(range);

        // rebuild the graph after query
        if (this.graphDiv) {
          Plotly.Plots.purge(this.graphDiv);
          this.graphDiv.innerHTML = '';
          this.initialized = false;
        }
      });
      this.initialized = true;
    } else if (this.initialized) {
      const rect = this.graphDiv.getBoundingClientRect();
      this.layout.width = rect.width;
      this.layout.height = this.getPanelHeight();

      Plotly.redraw(this.graphDiv).then(() => {
        this.renderingCompleted();
      });
    } else {
      console.log('Not initialized yet!');
    }
  }

  onDataSnapshotLoad(snapshot) {
    this.onDataReceived(snapshot);
  }

  _hadAnno = false;

  onDataReceived(dataList) {
    const finfo: SeriesWrapper[] = [];
    let seriesHash = '/';
    if (dataList && dataList.length > 0) {
      const useRefID = dataList.length === this.panel.targets.length;
      dataList.forEach((series, sidx) => {
        let refId = '';
        if (useRefID) {
          refId = _.get(this.panel, `targets[${sidx}].refId'`);
          if (!refId) {
            refId = String.fromCharCode('A'.charCodeAt(0) + sidx);
          }
        }
        if (series.columns) {
          for (let i = 0; i < series.columns.length; i++) {
            finfo.push(new SeriesWrapperTable(refId, series, i));
          }
          finfo.push(new SeriesWrapperTableRow(refId, series));
        } else if (series.target) {
          finfo.push(new SeriesWrapperSeries(refId, series, 'value'));
          finfo.push(new SeriesWrapperSeries(refId, series, 'time'));
          finfo.push(new SeriesWrapperSeries(refId, series, 'index'));
        } else {
          console.error('Unsupported Series response', sidx, series);
        }
      });
    }
    this.seriesByKey.clear();
    finfo.forEach(s => {
      s.getAllKeys().forEach(k => {
        this.seriesByKey.set(k, s);
        seriesHash += `$${k}`;
      });
    });
    this.series = finfo;

    // Now Process the loaded data
    const hchanged = this.seriesHash !== seriesHash;
    if (hchanged && this.editor) {
      EditorHelper.updateMappings(this);
      this.editor.selectTrace(this.editor.traceIndex);
      this.editor.onConfigChanged();
    }

    if (hchanged || !this.initialized) {
      this.onConfigChanged();
      this.seriesHash = seriesHash;
    }

    // Support Annotations
    let annotationPromise = Promise.resolve();
    if (!this.cfg.showAnnotations || this.is3d()) {
      this.annotations.clear();
      if (this.layout) {
        if (this.layout.shapes) {
          this.onConfigChanged();
        }
        this.layout.shapes = [];
      }
    } else {
      annotationPromise = this.annotationsSrv
        .getAnnotations({
          dashboard: this.dashboard,
          panel: this.panel,
          range: this.range,
        })
        .then(results => {
          const hasAnno = this.annotations.update(results);
          if (this.layout) {
            if (hasAnno !== this._hadAnno) {
              this.onConfigChanged();
            }
            this.layout.shapes = this.annotations.shapes;
          }
          this._hadAnno = hasAnno;
        });
    }

    // Load the real data changes
    annotationPromise.then(() => {
      this._updateTraceData();
      this.render();
    });
  }

  __addCopyPath(trace: any, key: string, path: string) {
    if (key) {
      trace.__set.push({
        key: key,
        path: path,
      });
      const s = this.seriesByKey.get(key);
      if (!s) {
        this.dataWarnings.push(`Unable to find: ${key} for ${trace.name} // ${path}`);
      }
    }
  }

  // This will update all trace settings *except* the data
  _updateTracesFromConfigs() {
    this.dataWarnings = [];

    // Make sure we have a trace
    if (this.cfg.traces == null || this.cfg.traces.length < 1) {
      this.cfg.traces = [_.cloneDeep(PlotlyPanelCtrl.defaultTrace)];
    }

    const is3D = this.is3d();
    this.traces = this.cfg.traces.map((tconfig, idx) => {
      const config = this.deepCopyWithTemplates(tconfig) || {};
      _.defaults(config, PlotlyPanelCtrl.defaults);
      const mapping = config.mapping;

      const trace: any = {
        name: config.name || EditorHelper.createTraceName(idx),
        type: this.cfg.settings.type,
        mode: 'markers+lines', // really depends on config settings
        __set: [], // { key:? property:? }
      };

      let mode = '';
      if (config.show.markers) {
        mode += '+markers';
        trace.marker = config.settings.marker;

        delete trace.marker.sizemin;
        delete trace.marker.sizemode;
        delete trace.marker.sizeref;

        if (config.settings.color_option === 'ramp') {
          this.__addCopyPath(trace, mapping.color, 'marker.color');
        } else {
          delete trace.marker.colorscale;
          delete trace.marker.showscale;
        }
      }

      if (config.show.lines) {
        mode += '+lines';
        trace.line = config.settings.line;
      }

      // Set the text
      this.__addCopyPath(trace, mapping.text, 'text');
      this.__addCopyPath(trace, mapping.x, 'x');
      this.__addCopyPath(trace, mapping.y, 'y');

      if (is3D) {
        this.__addCopyPath(trace, mapping.z, 'z');
      }

      // Set the trace mode
      if (mode) {
        trace.mode = mode.substring(1);
      }
      return trace;
    });
  }

  // Fills in the required data into the trace values
  _updateTraceData(force = false): boolean {
    if (!this.series) {
      return false;
    }

    if (force || !this.traces) {
      this._updateTracesFromConfigs();
    } else if (this.traces.length !== this.cfg.traces.length) {
      console.log(`trace number mismatch.  Found: ${this.traces.length}, expect: ${this.cfg.traces.length}`);
      this._updateTracesFromConfigs();
    }

    // Use zero when the metric value is missing
    // Plotly gets lots of errors when the values are missing
    let zero: any = [];
    this.traces.forEach(trace => {
      if (trace.__set) {
        trace.__set.forEach(v => {
          const s = this.seriesByKey.get(v.key);
          let vals: any[] = zero;
          if (s) {
            vals = s.toArray();
            if (vals && vals.length > zero.length) {
              zero = Array.from(new Array(3), () => 0);
            }
          } else {
            if (!this.error) {
              this.error = '';
            }
            this.error += `Unable to find: ${v.key} (using zeros).  `;
          }
          if (!vals) {
            vals = zero;
          }
          _.set(trace, v.path, vals);
        });
      }
    });

    return true;
  }

  onConfigChanged() {
    // Force reloading the traces
    this._updateTraceData(true);

    if (!Plotly) {
      return;
    }

    // Check if the plotly library changed
    loadIfNecessary(this.cfg).then(res => {
      if (res) {
        if (Plotly) {
          Plotly.purge(this.graphDiv);
        }
        Plotly = res;
      }

      // Updates the layout and redraw
      if (this.initialized && this.graphDiv) {
        if (!this.cfg.showAnnotations) {
          this.annotations.clear();
        }

        const s = this.cfg.settings;
        const options = {
          showLink: false,
          displaylogo: false,
          displayModeBar: s.displayModeBar,
          modeBarButtonsToRemove: ['sendDataToCloud'], //, 'select2d', 'lasso2d']
        };
        this.layout = this.getProcessedLayout();
        this.layout.shapes = this.annotations.shapes;
        let traces = this.traces;
        if (this.annotations.shapes.length > 0) {
          traces = this.traces.concat(this.annotations.trace);
        }
        console.log('ConfigChanged (traces)', traces);
        Plotly.react(this.graphDiv, traces, this.layout, options);
      }

      this.render(); // does not query again!
    });
  }

  is3d() {
    return this.cfg.settings.type === 'scatter3d';
  }

  link(scope, elem, attrs, ctrl) {
    this.graphDiv = elem.find('#plotly-spot')[0];
    this.initialized = false;
    elem.on('mousemove', evt => {
      this.mouse = evt;
    });
  }
}
