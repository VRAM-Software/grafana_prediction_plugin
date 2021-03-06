/* istanbul ignore file */
/**
 * File: editor.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-02-19
 * Description: Used to update the plotly graph
 */

import _ from 'lodash';

import { PlotlyPanelCtrl } from '../panelCtrl';
import { PlotlyPanelUtil } from './PlotlyPanelUtil';

class AxisInfo {
  label: string;
  layout: any; // The config saved in layout
  property: string; // mapping property to check in a trace
  segment: any; // The Grafana <metric-segment
}

const REMOVE_KEY = '-- remove --';

export class EditorHelper {
  axis: AxisInfo[];
  trace: any; // Trace Config
  traceIndex = 0;
  traces: any[]; // array of configs;

  symbol: any; // The Grafana <metric-segment for this symbol
  mapping: any = {}; // The Grafana <metric-segment for this symbol

  /** @ngInject */
  constructor(public ctrl: PlotlyPanelCtrl) {
    EditorHelper.updateMappings(ctrl);
    this.selectTrace(0);
  }

  // Callback when the query results changed
  static updateMappings(ctrl: PlotlyPanelCtrl): boolean {
    if (ctrl.plotlyPanelUtil.series == null || ctrl.plotlyPanelUtil.series.length < 1) {
      return false;
    }

    const defaultMappings = {
      first: ctrl.plotlyPanelUtil.series[0].getKey(),
      time: ctrl.plotlyPanelUtil.series[1].getKey(),
    };

    let changed = false;
    ctrl.plotlyPanelUtil.cfg.traces.forEach(trace => {
      _.defaults(trace, PlotlyPanelUtil.defaultTrace);
      const mapping = trace.mapping;
      if (!mapping.color) {
        mapping.color = defaultMappings.first;
        changed = true;
      }
      if (!mapping.x) {
        mapping.x = defaultMappings.time;
        changed = true;
      }
      if (!mapping.y) {
        mapping.y = defaultMappings.first;
        changed = true;
      }
      if (ctrl.plotlyPanelUtil.is3d() && !mapping.z) {
        mapping.z = defaultMappings.first;
        changed = true;
      }
    });
    return changed;
  }

  onConfigChanged() {
    this.onUpdateAxis(); // Every time????

    // Initalize the axis
    for (const i of this.axis) {
      if (i.layout.rangemode === 'between') {
        if (!_.isArray(i.layout.range)) {
          i.layout.range = [0, null];
        }
      } else {
        delete i.layout.range;
      }
    }

    this.ctrl.plotlyPanelUtil.onConfigChanged();
  }

  onUpdateAxis() {
    const mapping = this.trace.mapping;
    if (!mapping) {
      console.error('Missing mappings for trace', this.trace);
      return;
    }

    const layout = this.ctrl.plotlyPanelUtil.cfg.layout;
    if (!layout.xaxis) {
      layout.xaxis = {};
    }
    if (!layout.yaxis) {
      layout.yaxis = {};
    }

    this.axis = [];
    this.axis.push({
      label: 'X Axis',
      layout: layout.xaxis,
      property: 'x',
      segment: this.mapping.x,
    });
    this.axis.push({
      label: 'Y Axis',
      layout: layout.yaxis,
      property: 'y',
      segment: this.mapping.y,
    });

    if (this.ctrl.plotlyPanelUtil.is3d()) {
      if (!layout.zaxis) {
        layout.zaxis = {};
      }
      this.axis.push({
        label: 'Z Axis',
        layout: layout.zaxis,
        property: 'z',
        segment: this.mapping.z,
      });
    }
  }

  //-----------------------------------------------------------------------
  // Manage Traces
  //-----------------------------------------------------------------------

  selectTrace(index: number) {
    this.traces = this.ctrl.plotlyPanelUtil.cfg.traces;
    if (!this.traces || this.traces.length < 1) {
      this.traces = this.ctrl.plotlyPanelUtil.cfg.traces = [_.deepClone(PlotlyPanelUtil.defaultTrace)];
    }
    if (index >= this.ctrl.plotlyPanelUtil.cfg.traces.length) {
      index = this.ctrl.plotlyPanelUtil.cfg.traces.length - 1;
    }
    this.trace = this.ctrl.plotlyPanelUtil.cfg.traces[index];
    this.traceIndex = index;

    _.defaults(this.trace, PlotlyPanelUtil.defaultTrace);
    if (!this.trace.name) {
      this.trace.name = EditorHelper.createTraceName(index);
    }

    // The _defaults makes sure this is taken care of
    this.symbol = this.ctrl.uiSegmentSrv.newSegment({
      value: this.trace.settings.marker.symbol,
    });

    // Now set one for each key
    this.mapping = {};
    _.forEach(this.trace.mapping, (value, key) => {
      this.updateSegMapping(value, key);
    });

    console.log('Editor Info', this);

    this.onConfigChanged();
    this.ctrl.refresh();
  }

  private updateSegMapping(value, key, updateTrace = false) {
    if (REMOVE_KEY === value) {
      this.mapping[key] = this.ctrl.uiSegmentSrv.newSegment({
        value: 'Select Metric',
        fake: true,
      });
      value = null; // will set this value later
    } else if (value) {
      const s = this.ctrl.plotlyPanelUtil.seriesByKey.get(value);
      const opts: any = {
        value: value,
        series: s,
      };
      if (!s) {
        opts.html = `${value}  <i class="fa fa-exclamation-triangle"></i>`;
      }
      this.mapping[key] = this.ctrl.uiSegmentSrv.newSegment(opts);
    } else {
      this.mapping[key] = this.ctrl.uiSegmentSrv.newSegment({
        value: 'Select Metric',
        fake: true,
      });
    }

    if (updateTrace) {
      this.trace.mapping[key] = value;
      console.log('SET', key, value, this.trace.mapping);
    }
  }

  createTrace() {
    let trace: any = {};
    if (this.ctrl.plotlyPanelUtil.cfg.traces.length > 0) {
      trace = _.cloneDeep(this.ctrl.plotlyPanelUtil.cfg.traces[this.ctrl.plotlyPanelUtil.cfg.traces.length - 1]);
    } else {
      trace = _.deepClone(PlotlyPanelUtil.defaultTrace);
    }
    trace.name = EditorHelper.createTraceName(this.ctrl.plotlyPanelUtil.traces.length);
    this.ctrl.plotlyPanelUtil.cfg.traces.push(trace);
    this.selectTrace(this.ctrl.plotlyPanelUtil.cfg.traces.length - 1);
  }

  removeCurrentTrace() {
    if (this.traces.length <= 1) {
      console.error('Wont remove a single trace', this);
      return;
    }

    for (let i = 0; i < this.traces.length; i++) {
      if (this.trace === this.traces[i]) {
        this.traces.splice(i, 1);
        this.ctrl.plotlyPanelUtil.onConfigChanged();
        this.ctrl.plotlyPanelUtil._updateTraceData(true);
        if (i >= this.traces.length) {
          this.selectTrace(i);
        } else {
          this.selectTrace(this.traces.length - 1);
        }
        this.ctrl.refresh();
        return;
      }
    }

    console.error('Could not find', this);
  }

  static createTraceName(idx: number) {
    return `Trace ${idx + 1}`;
  }

  //-----------------------------------------------------------------------
  // SERIES
  //-----------------------------------------------------------------------

  getSeriesSegs(withRemove = false): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const series: any[] = [];

      if (withRemove) {
        series.push(
          this.ctrl.uiSegmentSrv.newSegment({
            fake: true,
            value: REMOVE_KEY,
            series: null,
          })
        );
      }
      this.ctrl.plotlyPanelUtil.series.forEach(s => {
        series.push(
          this.ctrl.uiSegmentSrv.newSegment({
            value: s.name,
            series: s,
          })
        );
      });

      resolve(series);
    });
  }

  onAxisSeriesChanged(axis: AxisInfo) {
    this.updateSegMapping(axis.segment.value, axis.property, true);
    this.onConfigChanged();
  }

  getTextSegments(): any[] {
    return [this.mapping.text];
  }

  onTextMetricChanged(sss: any) {
    const seg = this.mapping.text;
    this.updateSegMapping(seg.value, 'text', true);
    this.onConfigChanged();
  }

  getColorSegments(): any[] {
    if (this.trace.settings.color_option === 'ramp') {
      return [this.mapping.color];
    }
    return [];
  }

  onColorChanged() {
    const seg = this.mapping.color;
    this.updateSegMapping(seg.value, 'color', true);
    this.onConfigChanged();
  }

  //-----------------------------------------------------------------------
  // SYMBOLS
  //-----------------------------------------------------------------------

  onSymbolChanged() {
    this.trace.settings.marker.symbol = this.symbol.value;
    this.onConfigChanged();
  }

  getSymbolSegs(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const txt = [
        'circle',
        'circle-open',
        'circle-dot',
        'circle-open-dot',
        'square',
        'square-open',
        'square-dot',
        'square-open-dot',
        'diamond',
        'diamond-open',
        'diamond-dot',
        'diamond-open-dot',
        'cross',
        'cross-open',
        'cross-dot',
        'cross-open-dot',
        'x',
        'x-open',
        'x-dot',
        'x-open-dot',
        'triangle-up',
        'triangle-up-open',
        'triangle-up-dot',
        'triangle-up-open-dot',
        'triangle-down',
        'triangle-down-open',
        'triangle-down-dot',
        'triangle-down-open-dot',
        'triangle-left',
        'triangle-left-open',
        'triangle-left-dot',
        'triangle-left-open-dot',
        'triangle-right',
        'triangle-right-open',
        'triangle-right-dot',
        'triangle-right-open-dot',
        'triangle-ne',
        'triangle-ne-open',
        'triangle-ne-dot',
        'triangle-ne-open-dot',
        'triangle-se',
        'triangle-se-open',
        'triangle-se-dot',
        'triangle-se-open-dot',
        'triangle-sw',
        'triangle-sw-open',
        'triangle-sw-dot',
        'triangle-sw-open-dot',
        'triangle-nw',
        'triangle-nw-open',
        'triangle-nw-dot',
        'triangle-nw-open-dot',
        'pentagon',
        'pentagon-open',
        'pentagon-dot',
        'pentagon-open-dot',
        'hexagon',
        'hexagon-open',
        'hexagon-dot',
        'hexagon-open-dot',
        'hexagon2',
        'hexagon2-open',
        'hexagon2-dot',
        'hexagon2-open-dot',
        'octagon',
        'octagon-open',
        'octagon-dot',
        'octagon-open-dot',
        'star',
        'star-open',
        'star-dot',
        'star-open-dot',
        'hexagram',
        'hexagram-open',
        'hexagram-dot',
        'hexagram-open-dot',
        'star-triangle-up',
        'star-triangle-up-open',
        'star-triangle-up-dot',
        'star-triangle-up-open-dot',
        'star-triangle-down',
        'star-triangle-down-open',
        'star-triangle-down-dot',
        'star-triangle-down-open-dot',
        'star-square',
        'star-square-open',
        'star-square-dot',
        'star-square-open-dot',
        'star-diamond',
        'star-diamond-open',
        'star-diamond-dot',
        'star-diamond-open-dot',
        'diamond-tall',
        'diamond-tall-open',
        'diamond-tall-dot',
        'diamond-tall-open-dot',
        'diamond-wide',
        'diamond-wide-open',
        'diamond-wide-dot',
        'diamond-wide-open-dot',
        'hourglass',
        'hourglass-open',
        'bowtie',
        'bowtie-open',
        'circle-cross',
        'circle-cross-open',
        'circle-x',
        'circle-x-open',
        'square-cross',
        'square-cross-open',
        'square-x',
        'square-x-open',
        'diamond-cross',
        'diamond-cross-open',
        'diamond-x',
        'diamond-x-open',
        'cross-thin',
        'cross-thin-open',
        'x-thin',
        'x-thin-open',
        'asterisk',
        'asterisk-open',
        'hash',
        'hash-open',
        'hash-dot',
        'hash-open-dot',
        'y-up',
        'y-up-open',
        'y-down',
        'y-down-open',
        'y-left',
        'y-left-open',
        'y-right',
        'y-right-open',
        'line-ew',
        'line-ew-open',
        'line-ns',
        'line-ns-open',
        'line-ne',
        'line-ne-open',
        'line-nw',
        'line-nw-open',
      ];

      const segs: any[] = [];
      _.forEach(txt, val => {
        segs.push(this.ctrl.uiSegmentSrv.newSegment(val));
      });
      resolve(segs);
    });
  }
}
