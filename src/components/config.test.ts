/**
 * File: config.test.ts
 * Author: Marco Rampazzo
 * Creation date: 2020-04-02
 * Description: Test file for config.ts
 */

import { PluginMeta } from '@grafana/data';
import { GrafanaPredictionControl } from './config';

describe('test', () => {
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

  GrafanaPredictionControl.prototype.appEditCtrl = {
    setPostUpdateHook: x => {},
  };

  beforeEach(() => {
    console.log = jest.fn();
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
});
