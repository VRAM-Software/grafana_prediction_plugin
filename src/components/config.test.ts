/**
 * File: config.test.ts
 * Author: Marco Rampazzo
 * Creation date: 2020-04-02
 * Description: Test file for config.ts
 */

import { GrafanaPredictionControl } from './config';

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
let component: GrafanaPredictionControl;

console.log = jest.fn();

GrafanaPredictionControl.prototype.appEditCtrl = {
  setPostUpdateHook: jest.fn(),
};

beforeEach(() => {
  console.log.mockClear();
  component = new GrafanaPredictionControl(scope, injector);
});

test('Constructor is called', () => {
  expect(component.enabled).toBeFalsy();
  expect(component.appModel.jsonData).toEqual({});
  expect(typeof component.appModel).toBe('object');
  expect(console.log).toHaveBeenCalledTimes(1);
});

test('post update plugin disabled', () => {
  component.postUpdate();
  expect(console.log).toHaveBeenCalledTimes(2);
  expect(console.log).toHaveBeenCalledWith('plugin disabled');
});

test('post update plugin enabled', () => {
  component.appModel.enabled = true;
  component.postUpdate();
  expect(component.enabled).toBeTruthy();
  expect(console.log).toHaveBeenCalledTimes(2);
  expect(console.log).toHaveBeenCalledWith('Post Update, plugin loaded', component);
});

describe('appModel already initialized', () => {
  beforeEach(() => {
    GrafanaPredictionControl.prototype.appModel = {
      jsonData: 'JJ',
    };
    component = new GrafanaPredictionControl(scope, injector);
  });
  it('shouldnt initialize new appmodel', () => {
    expect(component.appModel.jsonData).toEqual('JJ');
  });
});
