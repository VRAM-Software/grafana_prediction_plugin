import { RxHR } from '@akanass/rx-http-request/browser/index.js';
import * as panel_json from './__test__/panel.json';
import { SelectInfluxDBCtrl, SelectInfluxDBDirective } from './selectInfluxDBTab';

const httpResponse = {
  response: {
    statusCode: 200,
  },
  body: '[{"url":"http://localhost:3000","database":"telegraf","user":"user","password":"password","type":"influxdb","name":"name","id":1 }]',
};

jest.mock('@akanass/rx-http-request/browser/index.js');
RxHR.get = jest.fn().mockImplementation(() => {
  return {
    subscribe: jest.fn().mockImplementation(fun => {
      fun(httpResponse);
    }),
  };
});

console.log = jest.fn();
console.error = jest.fn();

const scope = {
  ctrl: {
    refresh: jest.fn(),
    confirmDatabaseSettings: jest.fn(),
    publishAppEvent: jest.fn(),
    panel: panel_json,
  },
};

let si;

beforeEach(() => {
  console.log.mockClear();
  console.error.mockClear();
  si = new SelectInfluxDBCtrl(scope);
});

test('selectInfluxDBTab constructor', () => {
  expect(si.panelCtrl.refresh).toHaveBeenCalled();
});

test('getDatasources', () => {
  expect(console.log).toHaveBeenCalledWith('SelectInfluxDBCtrl - start loading datasources...');
});

test('updateDatabaseParams', () => {
  si.updateDatabaseParams();
  expect(si.panel.predictionSettings.influxHost).toEqual('http://localhost');
  expect(si.panel.predictionSettings.influxPort).toEqual('3000');
  expect(si.panelCtrl.confirmDatabaseSettings).toHaveBeenCalled();
});

test('SelectInfluxDBDirective', () => {
  let res = SelectInfluxDBDirective();
  expect(res.restrict).toEqual('E');
  expect(res.scope).toBeTruthy();
  expect(res.templateUrl).toEqual('public/plugins/grafana-prediction-plugin/panels/edit-panel/partials/selectInfluxDB.html');
});

describe('non influxdb type branch', () => {
  let sn;
  const nonInfluxHttpResponse = {
    response: {
      statusCode: 200,
    },
    body: '[{"url":"http://localhost:3000","database":"telegraf","user":"user","password":"password","type":"mongodb","name":"name","id":1 }]',
  };

  beforeEach(() => {
    RxHR.get = jest.fn().mockImplementation(() => {
      return {
        subscribe: jest.fn().mockImplementation(fun => {
          fun(nonInfluxHttpResponse);
        }),
      };
    });
    sn = new SelectInfluxDBCtrl(scope);
  });

  test('Ignoring database console log', () => {
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('SelectInfluxDBCtrl - Ignoring database with name'));
  });
});

describe('subscribe err/empty scope/invalid response branch', () => {
  let se;
  const error = 'httpResponse error';
  const scope = {
    ctrl: {
      refresh: jest.fn(),
      confirmDatabaseSettings: jest.fn(),
      publishAppEvent: jest.fn(),
      panel: {},
    },
  };
  const wrongStatusHttpResponse = {
    response: {
      statusCode: 77,
    },
    body: '[{"url":"http://localhost:3000","database":"telegraf","user":"user","password":"password","type":"mongodb","name":"name","id":1 }]',
  };

  beforeEach(() => {
    console.log.mockClear();
    console.error.mockClear();
    scope.ctrl.refresh.mockClear();
    RxHR.get = jest.fn().mockImplementation(() => {
      return {
        subscribe: jest.fn().mockImplementation((fun, err) => {
          fun(wrongStatusHttpResponse);
          err(error);
        }),
      };
    });
    se = new SelectInfluxDBCtrl(scope);
  });

  test('Console error for bad http response', () => {
    expect(console.error).toHaveBeenCalledWith(error);
  });

  test('No datasources loaded on bad http response status', () => {
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith('SelectInfluxDBCtrl - start loading datasources...');
    expect(se.datasources).toEqual({});
    expect(se.panelCtrl.refresh).not.toHaveBeenCalled();
  });

  test('Initialization of empty datasouces/targets', () => {
    expect(se.panel.datasource).toBeNull();
    expect(se.panel.targets).toEqual([{}]);
  });
});
