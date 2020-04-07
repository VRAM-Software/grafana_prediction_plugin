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

  PlotlyPanelCtrl.prototype.events = {
    on: jest.fn(),
    emitter: jest.fn(),
    emit: jest.fn(),
    removeAllListeners: jest.fn(),
    off: jest.fn(),
  };
  PlotlyPanelCtrl.prototype.panel = {
    gridPos: {
      w: 100,
    },
  };

  let ctrl = {} as any;
  beforeEach(() => {
    PlotlyPanelUtil.mockClear();
    ctrl = new PlotlyPanelCtrl(scope, injector, null, null, null, null);
    ctrl.annotationsPromise = Promise.resolve({});
    ctrl.updateTimeRange();
  });

  const epoch = 1505800000000;
  Date.now = () => epoch;

  it('should use default configs', () => {
    expect(JSON.stringify(ctrl.panel.predictionSettings)).toBe(JSON.stringify(PlotlyPanelCtrl.predictionPanelDefaults.predictionSettings));
  });

  describe('check settings migration', () => {
    beforeEach(() => {
      ctrl.panel = panel_json_v0;
      ctrl.onPanelInitialized();
    });

    it('it should now have have a version', () => {
      expect(ctrl.panel.predictionSettings.version).toBe(PlotlyPanelCtrl.predictionSettingsVersion);
      expect(PlotlyPanelUtil).toHaveBeenCalledTimes(1);
    });
  });

  test('events', () => {
    let panel = new PlotlyPanelCtrl(scope, injector, null, null, null, null);
    expect(panel.events.on).toHaveBeenCalled(); 
  });

  describe('test constructor', () => {
    document.body.innerHTML =
        '<div id="plotly-spot">' +
          '<div>Cose</div>' +
        '</div>';

    const elem = {
      find: jest.fn((string) => {
        [ 'Test', 'Tast' ]
      })
    };

    let panel = new PlotlyPanelCtrl(scope, injector, null, null, null, null);
    panel.otherPanelInFullscreenMode = jest.fn(() => false);
    panel.addEditorTab = jest.fn();
    const spyDataReceived = jest.spyOn(panel, 'onDataReceived');

    Object.defineProperty(panel, 'graphDiv', {
      get: jest.fn(() => true)
    });

    test('calls onInitEditMode', () => {
      panel.onInitEditMode();
      expect(panel.addEditorTab).toHaveBeenCalled();
      expect(panel.plotlyPanelUtil.plotlyOnInitEditMode).toHaveBeenCalled();
      expect(panel.plotlyPanelUtil.onConfigChanged).toHaveBeenCalled();
    });
    test('loading data and snapshots', () => {
      panel.onDataSnapshotLoad({});
      expect(spyDataReceived).toHaveBeenCalled();
      expect(panel.plotlyPanelUtil.plotlyDataReceived).toHaveBeenCalledWith({}, null);
    });
    /*
    test('link method', () => {
      panel.link(scope, elem, null, null);
      //expect(panel.graphDiv).toEqual(elem.find("test")[0]);
      expect(panel.plotlyPanelUtil.initialized).toBeFalsy();
    });
    */
    test('graphDiv getter', () => {
      const gd = panel.graphDiv;
      expect(gd).toEqual(true);
    });
    test('resize method', () => {
      panel.onResize();
      expect(panel.plotlyPanelUtil.plotlyOnResize).toHaveBeenCalled();
    });
    test('onDataError method', () => {
      const spyRender = jest.spyOn(panel, 'render');
      panel.onDataError('e');
      expect(panel.plotlyPanelUtil.plotlyOnDataError).toHaveBeenCalled();
      expect(spyRender).toHaveBeenCalled();
    });
    /*
    test('dataReceived event', () => {
      const spyDataReceived = jest.spyOn(panel, 'onDataReceived');
      event.PanelEvents.render();
      expect(spyDataReceived).toHaveBeenCalled();
    });
    */


    describe('branches with PanelInFullscreenMode', () => {
      beforeAll(() => {
        panel.otherPanelInFullscreenMode = jest.fn(() => true);
      });
      test('onRender method, return branch', () => {
        panel.onRender();
        expect(panel.plotlyPanelUtil.plotlyOnRender).not.toHaveBeenCalled();
      });
      test('onRefresh method, return branch', () => {
        panel.onRefresh();
        expect(panel.plotlyPanelUtil.plotlyOnRefresh).not.toHaveBeenCalled();
      });
    });

    describe('branches without PanelInFullscreenMode', () => {
      beforeAll(() => {
        panel.otherPanelInFullscreenMode = jest.fn(() => false);
      });
      test('onRender method', () => {
        panel.onRender();
        expect(panel.plotlyPanelUtil.plotlyOnRender).toHaveBeenCalled();
      });
      test('onRefresh method', () => {
        panel.onRefresh();
        expect(panel.plotlyPanelUtil.plotlyOnRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('check json upload and deletion', () => {
    let json = new File([""], "mock", { type: 'application/json' });
    beforeEach(() => {
      ctrl.publishAppEvent = jest.fn();
      ctrl.panel = panel_json_v0;
      ctrl.delete_json_click();
      //ctrl.onUpload(json);
    });

    it('should have deleted the file and published event', () => {
      expect(ctrl.predictionPanelConfig.json).toBe(null);
      expect(ctrl.publishAppEvent).toHaveBeenCalled();
    });
    it('should call the onUpload method, load json and publish event', () => {
      ctrl.upload_button_click(json);
      expect(ctrl.panel.predictionSettings.json).toBe(JSON.stringify(json));
      expect(ctrl.publishAppEvent).toHaveBeenCalled();
    });
  });
});
