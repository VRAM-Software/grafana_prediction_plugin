/**
 * File: panelCtrl.test.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-02-19
 * Description: Test file for panelCtrl.ts
 */

import { PlotlyPanelCtrl } from './panelCtrl';

import * as panel_json_v0 from './__testData/panel_json_v0.json';
import { PlotlyPanelUtil } from './plotly/PlotlyPanelUtil';

jest.mock('./plotly/PlotlyPanelUtil');

describe('Plotly Panel', () => {
  const injector = {
    get: () => {
      return {
        timeRange: () => {
          return {
            from: '',
            to: '',
          };
        },
      };
    },
  };

  const scope = {
    $on: () => {},
  };

  PlotlyPanelCtrl.prototype.panel = {
    events: {
      on: () => {},
    },
    gridPos: {
      w: 100,
    },
  };

  const ctx = {} as any;
  beforeEach(() => {
    PlotlyPanelUtil.mockClear();
    ctx.ctrl = new PlotlyPanelCtrl(scope, injector, null, null, null, null);
    ctx.ctrl.events = {
      emit: () => {},
    };
    ctx.ctrl.annotationsPromise = Promise.resolve({});
    ctx.ctrl.updateTimeRange();
  });

  const epoch = 1505800000000;
  Date.now = () => epoch;

  describe('check Defaults', () => {
    beforeEach(() => {
      // nothing specal
    });

    it('it should use default configs', () => {
      expect(JSON.stringify(ctx.ctrl.panel.predictionSettings)).toBe(JSON.stringify(PlotlyPanelCtrl.predictionPanelDefaults.predictionSettings));
    });
  });

  describe('check settings migration', () => {
    beforeEach(() => {
      ctx.ctrl.panel = panel_json_v0;
      ctx.ctrl.onPanelInitialized();
    });

    it('it should now have have a version', () => {
      expect(ctx.ctrl.panel.predictionSettings.version).toBe(PlotlyPanelCtrl.predictionSettingsVersion);
      expect(PlotlyPanelUtil).toHaveBeenCalledTimes(1);
    });
  });

  describe('check json deletion', () => {
    beforeEach(() => {
      ctx.ctrl.panel = panel_json_v0;
      ctx.ctrl.delete_json_click();
    });

    it('it should have deleted the file', () => {
      expect(ctx.ctrl.predictionPanelConfig.json).toBe(null);
      // controllo del messaggio di successo
    });
  });

  describe('check json upload', () => {
    let json = new File([""], "mock", { type: 'application/json' });
    beforeEach(() => {
      ctx.ctrl.panel = panel_json_v0;
      ctx.ctrl.onUpload(json);
    });

    it('it should have uploaded the file', () => {
      expect(ctx.ctrl.panel.predictionSettings.json).toBe(JSON.stringify(json));
      // controllo del messaggio di successo
    });
  });
});
