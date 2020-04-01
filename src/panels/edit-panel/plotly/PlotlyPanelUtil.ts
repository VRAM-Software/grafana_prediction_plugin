/**
 * File: PlotlyPanelUtil.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-02-19
 * Description: Utility class for the main control panel of the app plugin
 */
import { PlotlyPanelCtrl } from '../panelCtrl';
import _ from 'lodash';

import { Axis } from 'plotly.js';
import { EditorHelper } from './editor';
import $ from 'jquery';
import { loadIfNecessary } from './libLoader';
import { DateTime } from 'luxon';
import { AppEvents } from '@grafana/data';
import alertSuccess = AppEvents.alertSuccess;
import { SeriesWrapper, SeriesWrapperSeries, SeriesWrapperTable, SeriesWrapperTableRow } from './SeriesWrapper';

export class PlotlyPanelUtil {
  static configVersion = 1; // An index to help config migration
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

  static defaults = {
    pconfig: {
      loadFromCDN: false,
      showAnnotations: true,
      fixScale: '',
      traces: [PlotlyPanelUtil.defaultTrace],
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

  static yaxis2: Partial<Axis> = {
    title: 'Annotations',
    type: 'linear',
    range: [0, 1],
    visible: false,
  };

  getPanelHeight(ctrl: PlotlyPanelCtrl) {
    // panel can have a fixed height set via "General" tab in panel editor
    let tmpPanelHeight = ctrl.panel.height;
    if (typeof tmpPanelHeight === 'undefined' || tmpPanelHeight === '') {
      // grafana also supplies the height, try to use that if the panel does not have a height
      tmpPanelHeight = String(ctrl.height);
      // v4 and earlier define this height, detect span for pre-v5
      if (typeof ctrl.panel.span !== 'undefined') {
        // if there is no header, adjust height to use all space available
        var panelTitleOffset = 20;
        if (ctrl.panel.title !== '') {
          panelTitleOffset = 42;
        }
        tmpPanelHeight = String(ctrl.containerHeight - panelTitleOffset); // offset for header
      }
      if (typeof tmpPanelHeight === 'undefined') {
        // height still cannot be determined, get it from the row instead
        tmpPanelHeight = ctrl.row.height;
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

  is3d(ctrl: PlotlyPanelCtrl) {
    return ctrl.cfg.settings.type === 'scatter3d';
  }

  deepCopyWithTemplates = (ctrl: PlotlyPanelCtrl, obj) => {
    if (_.isArray(obj)) {
      return obj.map(val => this.deepCopyWithTemplates(ctrl, val));
    } else if (_.isString(obj)) {
      return ctrl.templateSrv.replace(obj, ctrl.panel.scopedVars);
    } else if (_.isObject(obj)) {
      const copy = {};
      _.forEach(obj, (v, k) => {
        copy[k] = this.deepCopyWithTemplates(ctrl, v);
      });
      return copy;
    }
    return obj;
  };

  __addCopyPath(ctrl: PlotlyPanelCtrl, trace: any, key: string, path: string) {
    if (key) {
      trace.__set.push({
        key: key,
        path: path,
      });
      const s = ctrl.seriesByKey.get(key);
      if (!s) {
        ctrl.dataWarnings.push(`Unable to find: ${key} for ${trace.name} // ${path}`);
      }
    }
  }

  // This will update all trace settings *except* the data
  _updateTracesFromConfigs(ctrl: PlotlyPanelCtrl) {
    ctrl.dataWarnings = [];

    // Make sure we have a trace
    if (ctrl.cfg.traces == null || ctrl.cfg.traces.length < 1) {
      ctrl.cfg.traces = [_.cloneDeep(PlotlyPanelUtil.defaultTrace)];
    }

    const is3D = this.is3d(ctrl);
    ctrl.traces = ctrl.cfg.traces.map((tconfig, idx) => {
      const config = this.deepCopyWithTemplates(ctrl, tconfig) || {};
      _.defaults(config, PlotlyPanelUtil.defaults);
      const mapping = config.mapping;

      const trace: any = {
        name: config.name || EditorHelper.createTraceName(idx),
        type: ctrl.cfg.settings.type,
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
          this.__addCopyPath(ctrl, trace, mapping.color, 'marker.color');
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
      this.__addCopyPath(ctrl, trace, mapping.text, 'text');
      this.__addCopyPath(ctrl, trace, mapping.x, 'x');
      this.__addCopyPath(ctrl, trace, mapping.y, 'y');

      if (is3D) {
        this.__addCopyPath(ctrl, trace, mapping.z, 'z');
      }

      // Set the trace mode
      if (mode) {
        trace.mode = mode.substring(1);
      }
      return trace;
    });
  }

  // Fills in the required data into the trace values
  _updateTraceData(ctrl: PlotlyPanelCtrl, force = false): boolean {
    if (!ctrl.series) {
      return false;
    }

    if (force || !ctrl.traces) {
      this._updateTracesFromConfigs(ctrl);
    } else if (ctrl.traces.length !== ctrl.cfg.traces.length) {
      console.log(`trace number mismatch.  Found: ${ctrl.traces.length}, expect: ${ctrl.cfg.traces.length}`);
      this._updateTracesFromConfigs(ctrl);
    }

    // Use zero when the metric value is missing
    // Plotly gets lots of errors when the values are missing
    let zero: any = [];
    ctrl.traces.forEach(trace => {
      if (trace.__set) {
        trace.__set.forEach(v => {
          const s = ctrl.seriesByKey.get(v.key);
          let vals: any[] = zero;
          if (s) {
            vals = s.toArray();
            if (vals && vals.length > zero.length) {
              zero = Array.from(new Array(3), () => 0);
            }
          } else {
            if (!ctrl.error) {
              ctrl.error = '';
            }
            ctrl.error += `Unable to find: ${v.key} (using zeros).  `;
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

  getProcessedLayout(ctrl: PlotlyPanelCtrl) {
    // Copy from config
    const layout = this.deepCopyWithTemplates(ctrl, ctrl.cfg.layout);
    layout.plot_bgcolor = 'transparent';
    layout.paper_bgcolor = layout.plot_bgcolor;

    // Update the size
    const rect = ctrl.graphDiv.getBoundingClientRect();
    layout.autosize = false; // height is from the div
    layout.height = this.getPanelHeight(ctrl);
    layout.width = rect.width;

    // Make sure it is something
    if (!layout.xaxis) {
      layout.xaxis = {};
    }
    if (!layout.yaxis) {
      layout.yaxis = {};
    }

    // Fixed scales
    if (ctrl.cfg.fixScale) {
      if ('x' === ctrl.cfg.fixScale) {
        layout.yaxis.scaleanchor = 'x';
      } else if ('y' === ctrl.cfg.fixScale) {
        layout.xaxis.scaleanchor = 'y';
      } else if ('z' === ctrl.cfg.fixScale) {
        layout.xaxis.scaleanchor = 'z';
        layout.yaxis.scaleanchor = 'z';
      }
    }

    if (this.is3d(ctrl)) {
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
        const mapping = _.get(ctrl.cfg, 'traces[0].mapping.x');
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
        const range = ctrl.timeSrv.timeRange();
        layout.xaxis.range = [range.from.valueOf(), range.to.valueOf()];
      }

      // get the css rule of grafana graph axis text
      const labelStyle = this.getCssRule(ctrl, 'div.flot-text');
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
      layout.yaxis2 = PlotlyPanelUtil.yaxis2;
    }
    return layout;
  }

  getCssRule(ctrl: PlotlyPanelCtrl, selectorText): CSSStyleRule | null {
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

  processConfigMigration(ctrl: PlotlyPanelCtrl) {
    console.log(`Migrating Plotly Configuration to version: ${PlotlyPanelUtil.configVersion}`);

    // Remove some things that should not be saved
    const cfg = ctrl.panel.pconfig;
    delete cfg.layout.plot_bgcolor;
    delete cfg.layout.paper_bgcolor;
    delete cfg.layout.autosize;
    delete cfg.layout.height;
    delete cfg.layout.width;
    delete cfg.layout.margin;
    delete cfg.layout.scene;
    if (!this.is3d(ctrl)) {
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
    ctrl.cfg = cfg;
    ctrl.panel.version = PlotlyPanelUtil.configVersion;
  }

  // Don't call resize too quickly
  doResize = _.debounce((ctrl: PlotlyPanelCtrl) => {
    // https://github.com/alonho/angular-plotly/issues/26
    const e = window.getComputedStyle(ctrl.graphDiv).display;
    if (!e || 'none' === e) {
      // not drawn!
      console.warn('resize a plot that is not drawn yet');
    } else {
      const rect = ctrl.graphDiv.getBoundingClientRect();
      ctrl.layout.width = rect.width;
      ctrl.layout.height = this.getPanelHeight(ctrl);

      ctrl.Plotly.redraw(ctrl.graphDiv);
    }
  }, 50);

  onConfigChanged(ctrl: PlotlyPanelCtrl) {
    // Force reloading the traces
    this._updateTraceData(ctrl, true);

    if (!ctrl.Plotly) {
      return;
    }

    // Check if the plotly library changed
    loadIfNecessary(ctrl.cfg).then(res => {
      if (res) {
        if (ctrl.Plotly) {
          ctrl.Plotly.purge(ctrl.graphDiv);
        }
        ctrl.Plotly = res;
      }

      // Updates the layout and redraw
      if (ctrl.initialized && ctrl.graphDiv) {
        if (!ctrl.cfg.showAnnotations) {
          ctrl.annotations.clear();
        }

        const s = ctrl.cfg.settings;
        const options = {
          showLink: false,
          displaylogo: false,
          displayModeBar: s.displayModeBar,
          modeBarButtonsToRemove: ['sendDataToCloud'], //, 'select2d', 'lasso2d']
        };
        ctrl.layout = this.getProcessedLayout(ctrl);
        ctrl.layout.shapes = ctrl.annotations.shapes;
        let traces = ctrl.traces;
        if (ctrl.annotations.shapes.length > 0) {
          traces = ctrl.traces.concat(ctrl.annotations.trace);
        }
        console.log('ConfigChanged (traces)', traces);
        ctrl.Plotly.react(ctrl.graphDiv, traces, ctrl.layout, options);
      }

      ctrl.render(); // does not query again!
    });
  }

  renderPlotly(ctrl: PlotlyPanelCtrl, $rootScope) {
    if (!ctrl.initialized) {
      const s = ctrl.cfg.settings;

      const options = {
        showLink: false,
        displaylogo: false,
        displayModeBar: s.displayModeBar,
        modeBarButtonsToRemove: ['sendDataToCloud'], //, 'select2d', 'lasso2d']
      };

      ctrl.layout = this.getProcessedLayout(ctrl);
      ctrl.layout.shapes = ctrl.annotations.shapes;
      let traces = ctrl.traces;
      if (ctrl.annotations.shapes.length > 0) {
        traces = ctrl.traces.concat(ctrl.annotations.trace);
      }
      ctrl.Plotly.react(ctrl.graphDiv, traces, ctrl.layout, options);

      ctrl.graphDiv.on('plotly_click', data => {
        if (data === undefined || data.points === undefined) {
          return;
        }
        for (const i of data.points) {
          const idx = i.pointNumber;
          const ts = ctrl.traces[0].ts[idx];
          const msg = `${i.x.toPrecision(4)}, ${i.y.toPrecision(4)}`;
          $rootScope.appEvent(alertSuccess, [msg, `@ ${ctrl.dashboard.formatDate(DateTime.fromMillis(ts))}`]);
        }
      });

      ctrl.graphDiv.on('plotly_selected', data => {
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

        ctrl.timeSrv.setTime(range);

        // rebuild the graph after query
        if (ctrl.graphDiv) {
          ctrl.Plotly.Plots.purge(ctrl.graphDiv);
          ctrl.graphDiv.innerHTML = '';
          ctrl.initialized = false;
        }
      });
      ctrl.initialized = true;
    } else if (ctrl.initialized) {
      const rect = ctrl.graphDiv.getBoundingClientRect();
      ctrl.layout.width = rect.width;
      ctrl.layout.height = this.getPanelHeight(ctrl);

      ctrl.Plotly.redraw(ctrl.graphDiv).then(() => {
        ctrl.renderingCompleted();
      });
    } else {
      console.log('Not initialized yet!');
    }
  }

  plotlyDataReceived(ctrl: PlotlyPanelCtrl, dataList, annotationsSrv) {
    const finfo: SeriesWrapper[] = [];
    let seriesHash = '/';
    if (dataList && dataList.length > 0) {
      const useRefID = dataList.length === ctrl.panel.targets.length;
      dataList.forEach((series, sidx) => {
        let refId = '';
        if (useRefID) {
          refId = _.get(ctrl.panel, `targets[${sidx}].refId'`);
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
    ctrl.seriesByKey.clear();
    finfo.forEach(s => {
      s.getAllKeys().forEach(k => {
        ctrl.seriesByKey.set(k, s);
        seriesHash += `$${k}`;
      });
    });
    ctrl.series = finfo;

    // Now Process the loaded data
    const hchanged = ctrl.seriesHash !== seriesHash;
    if (hchanged && ctrl.editor) {
      EditorHelper.updateMappings(ctrl);
      ctrl.editor.selectTrace(ctrl.editor.traceIndex);
      ctrl.editor.onConfigChanged();
    }

    if (hchanged || !ctrl.initialized) {
      this.onConfigChanged(ctrl);
      ctrl.seriesHash = seriesHash;
    }

    // Support Annotations
    let annotationPromise = Promise.resolve();
    if (!ctrl.cfg.showAnnotations || this.is3d(ctrl)) {
      ctrl.annotations.clear();
      if (ctrl.layout) {
        if (ctrl.layout.shapes) {
          this.onConfigChanged(ctrl);
        }
        ctrl.layout.shapes = [];
      }
    } else {
      annotationPromise = annotationsSrv
        .getAnnotations({
          dashboard: ctrl.dashboard,
          panel: ctrl.panel,
          range: ctrl.range,
        })
        .then(results => {
          const hasAnno = ctrl.annotations.update(results);
          if (ctrl.layout) {
            if (hasAnno !== ctrl._hadAnno) {
              this.onConfigChanged(ctrl);
            }
            ctrl.layout.shapes = ctrl.annotations.shapes;
          }
          ctrl._hadAnno = hasAnno;
        });
    }

    // Load the real data changes
    annotationPromise.then(() => {
      this._updateTraceData(ctrl);
      ctrl.render();
    });
  }
}
