import * as panel_json from './__test__/panel.json';
import { SelectInfluxDBCtrl, SelectInfluxDBDirective } from './selectInfluxDBTab';

console.log = jest.fn();

const scope = {
  ctrl: {
    panel: panel_json,
  },
};

let si;

beforeEach(() => {
  si = new SelectInfluxDBCtrl(scope);
  si.panelCtrl.confirmDatabaseSettings = jest.fn();
});

test('getDatasources', () => {
  si.getDatasources();
  expect(console.log).toHaveBeenCalledWith('SelectInfluxDBCtrl - start loading datasources...');
});

//test('updateDatabaseParams', () => {
//  si.updateDatabaseParams();
//  expect(si.panelCtrl.confirmDatabaseSettings).toHaveBeenCalled();
//});

test('SelectInfluxDBDirective', () => {
  let res = SelectInfluxDBDirective();
  expect(res.restrict).toEqual('E');
  expect(res.scope).toBeTruthy();
  expect(res.templateUrl).toEqual('public/plugins/grafana-prediction-plugin/panels/edit-panel/partials/selectInfluxDB.html');
});
