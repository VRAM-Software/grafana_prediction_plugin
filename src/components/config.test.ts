import { TestControl } from './config';

describe('test', () => {
  test('Constructor is called', () => {
    let $location: any = '/';
    let component = new TestControl($location);
    component.appEditCtrl = {
      setPostUpdateHook: jest.fn()
    };
    expect(component.appModel.jsonData).toEqual({});
    expect(component.$location).toEqual('/');
    expect(typeof component.appModel).toBe('object');
  });

  test('post update', () => {
    const log = (logMsg: any) => console.log(logMsg);
    let $location: any = '/';
    console.log = jest.fn();
    let component = new TestControl($location);
    component.appEditCtrl = {
      setPostUpdateHook: jest.fn()
    };
    component.postUpdate();
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith('plugin disabled');
  });
});