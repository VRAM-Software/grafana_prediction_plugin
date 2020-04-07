/**
 * File: panelCtrl.test.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-02-19
 * Description: Test file for panelCtrl.ts
 */

import { PlotlyPanelCtrl } from './panelCtrl';
import { PanelEvents } from '@grafana/data';
import * as panel_json from './__testData/panel.json';
import { PlotlyPanelUtil } from './plotly/PlotlyPanelUtil';

jest.mock('./plotly/PlotlyPanelUtil');
console.log = jest.fn();

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
const elem = {
  find: (string) => [ true ]
};
const json = {
  predictors: [ "a", "b", "c" ]
}
const predictors = json.predictors.map((a, index) => {
  return { id: index, name: a };
});
const dataList = [
  { target: "a" }
];
const dataList2 = [
  { target: "b" }
];
document.body.innerHTML =
  '<div id="plotly-spot">' +
    '<div>Cose</div>' +
  '</div>';

const epoch = 1505800000000;
Date.now = () => epoch;

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

let ctrl;
beforeEach(() => {
  PlotlyPanelUtil.mockClear();
  ctrl = new PlotlyPanelCtrl(scope, injector, null, null, null, null);
  ctrl.otherPanelInFullscreenMode = jest.fn(() => false);
  ctrl.annotationsPromise = Promise.resolve({});
  ctrl.link(scope, elem, null, null);
  ctrl.publishAppEvent = jest.fn();
  ctrl.addEditorTab = jest.fn();
  ctrl.updateTimeRange();
});

it('should set eventhanlers', () => {
  expect(ctrl.events.on).toHaveBeenCalledWith(PanelEvents.render, expect.anything()); 
  expect(ctrl.events.on).toHaveBeenCalledWith(PanelEvents.dataReceived, expect.anything()); 
  expect(ctrl.events.on).toHaveBeenCalledWith(PanelEvents.dataError, expect.anything()); 
  expect(ctrl.events.on).toHaveBeenCalledWith(PanelEvents.panelSizeChanged, expect.anything()); 
  expect(ctrl.events.on).toHaveBeenCalledWith(PanelEvents.dataSnapshotLoad, expect.anything()); 
  expect(ctrl.events.on).toHaveBeenCalledWith(PanelEvents.refresh, expect.anything()); 
  expect(ctrl.events.on).toHaveBeenCalledWith(PanelEvents.editModeInitialized, expect.anything()); 
  expect(ctrl.events.on).toHaveBeenCalledWith(PanelEvents.panelInitialized, expect.anything()); 
});

it('should use default configs', () => {
  expect(JSON.stringify(ctrl.panel.predictionSettings)).toBe(JSON.stringify(PlotlyPanelCtrl.predictionPanelDefaults.predictionSettings));
});
test('link method', () => {
  expect(ctrl.graphDiv).toBeTruthy();
  expect(ctrl.plotlyPanelUtil.initialized).toBeFalsy();
});
test('graphDiv getter', () => {
  const gd = ctrl.graphDiv;
  expect(gd).toEqual(true);
});

describe('Test previous configuration has been loaded', () => {
  beforeEach(() => {
    ctrl.panel = panel_json;
  });

  it('it should now have a version', () => {
    ctrl.onPanelInitialized();
    expect(ctrl.panel.predictionSettings.version).toBe(PlotlyPanelCtrl.predictionSettingsVersion);
    expect(PlotlyPanelUtil).toHaveBeenCalledTimes(1);
  });
  it('should have deleted the file and published event', () => {
    ctrl.deleteJsonClick();
    expect(ctrl.predictionPanelConfig.json).toBe(null);
    expect(ctrl.publishAppEvent).toHaveBeenCalled();
  });
  it('should call the onUpload method, load json and publish event', () => {
    ctrl.uploadButtonClick(json);
    expect(ctrl.panel.predictionSettings.json).toBe(JSON.stringify(json));
    expect(ctrl.panel.predictionSettings.predictors).toEqual(predictors);
    expect(ctrl.publishAppEvent).toHaveBeenCalled();
  });
  test('Query confirm method', () => {
    ctrl.confirmQueries();
    expect(console.log).toHaveBeenCalled();
  });
});

describe('Branches with version already set', () => {
  beforeEach(() => {
    ctrl.panel.predictionSettings.version = 1000;
  });
  it('it should not update version', () => {
    ctrl.onPanelInitialized();
    expect(ctrl.panel.predictionSettings.version).not.toBe(PlotlyPanelCtrl.predictionSettingsVersion);
    expect(PlotlyPanelUtil).toHaveBeenCalledTimes(1);
  });  
});

test('calls onInitEditMode', () => {
  ctrl.onInitEditMode();
  expect(ctrl.addEditorTab).toHaveBeenCalled();
  expect(ctrl.plotlyPanelUtil.plotlyOnInitEditMode).toHaveBeenCalled();
  expect(ctrl.plotlyPanelUtil.onConfigChanged).toHaveBeenCalled();
});

describe('Branches with PlotlyEditMode loaded', () => {
  beforeEach(() => {
    ctrl.plotlyPanelUtil.isPlotlyEditModeLoaded = () => true;
  })
  test('calls onInitEditMode', () => {
    ctrl.onInitEditMode();
    expect(ctrl.addEditorTab).not.toHaveBeenCalled();
  });
});

test('loading data and snapshots', () => {
  const spyDataReceived = jest.spyOn(ctrl, 'onDataReceived');
  ctrl.onDataSnapshotLoad(dataList);
  expect(spyDataReceived).toHaveBeenCalled();
  expect(ctrl.plotlyPanelUtil.plotlyDataReceived).toHaveBeenCalledWith(dataList, null);
});
test('Query updater method', () => {
  ctrl.updateQueries(dataList);
  ctrl.updateQueries(dataList2);
  expect(ctrl.panel.predictionSettings.nodeMap).toStrictEqual([]);
});
test('onDataError method', () => {
  const spyRender = jest.spyOn(ctrl, 'render');
  ctrl.onDataError('e');
  expect(ctrl.plotlyPanelUtil.plotlyOnDataError).toHaveBeenCalled();
  expect(spyRender).toHaveBeenCalled();
});

test('onResize method', () => {
  ctrl.onResize();
  expect(ctrl.plotlyPanelUtil.plotlyOnResize).toHaveBeenCalled();
});
test('onRender method', () => {
  ctrl.onRender();
  expect(ctrl.plotlyPanelUtil.plotlyOnRender).toHaveBeenCalled();
});
test('onRefresh method', () => {
  ctrl.onRefresh();
  expect(ctrl.plotlyPanelUtil.plotlyOnRefresh).toHaveBeenCalled();
});

describe('branches without graphDiv', () => {
  beforeEach(() => {
    Object.defineProperty(ctrl, 'graphDiv', {
      get: jest.fn(() => false)
    });
  });
  test('onResize method', () => {
    ctrl.onResize();
    expect(ctrl.plotlyPanelUtil.plotlyOnResize).not.toHaveBeenCalled();
  });
  test('onRefresh method', () => {
    ctrl.onRefresh();
    expect(ctrl.plotlyPanelUtil.plotlyOnRefresh).not.toHaveBeenCalled();
  });
});

describe('branches with PanelInFullscreenMode', () => {
  beforeEach(() => {
    ctrl.otherPanelInFullscreenMode = jest.fn(() => true);
  });
  test('onRender method, return branch', () => {
    ctrl.onRender();
    expect(ctrl.plotlyPanelUtil.plotlyOnRender).not.toHaveBeenCalled();
  });
  test('onRefresh method, return branch', () => {
    ctrl.onRefresh();
    expect(ctrl.plotlyPanelUtil.plotlyOnRefresh).not.toHaveBeenCalled();
  });
});
