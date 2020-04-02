/**
 * File: config.test.ts
 * Author: Marco Rampazzo
 * Creation date: 2020-04-02
 * Description: Test file for config.ts
 */

import { TestControl } from './config';

describe('test', () => {
  let component: TestControl;
  const $location = '/';

  beforeEach(() => {
    console.log = jest.fn();
    component = new TestControl($location);
  });

  test('Constructor is called', () => {
    expect(component.appModel.jsonData).toEqual({});
    expect(component.$location).toEqual('/');
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
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith('Post Update, plugin loaded', component);
  });
});
