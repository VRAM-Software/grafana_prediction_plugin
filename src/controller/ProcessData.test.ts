import { ProcessData } from './ProcessData';
import { WriteInfluxParameters, SvmJsonConfiguration, RlJsonConfiguration } from '../types/types';
import { ProcessSvm } from './process/ProcessSvm';
import { SvmPrediction } from '../model/algorithm/SvmPrediction';
import { RlPrediction } from '../model/algorithm/RlPrediction';

console.log = jest.fn();
console.error = jest.fn();

const mockSvmPredict = jest.fn();
const mockRlPredict = jest.fn();
//Faccio il mock della classe assegnandole una funzione costruttore mockata
SvmPrediction = jest.fn().mockImplementation(() => {
  return { predict: mockSvmPredict };
});
RlPrediction = jest.fn().mockImplementation(() => {
  return { predict: mockRlPredict };
});

const dataList = [
  { target: 'target', datapoints: [[1]] },
  { target: 'target', datapoints: [[1]] },
];
const nodeMap = new Map([['A-series', 'A-predictor']]);
const influxParameters: WriteInfluxParameters = {
  host: 'http://localhost',
  port: '3000',
  database: 'Grafana',
  credentials: ['', ''],
  measurement: 'load',
  fieldKey: 'fieldkey',
};
const svmConfiguration: SvmJsonConfiguration = {
  pluginAim: 'svm',
  predictors: ['weight', 'size'],
  result: {
    N: 15,
    D: 2,
    b: 63.30499208064203,
    kernelType: 'linear',
    w: [-0.8471448086741091, -0.9149644375601502],
  },
  notes: 'notes',
};
const rlConfiguration: RlJsonConfiguration = {
  pluginAim: 'rl',
  predictors: ['giallo', 'rosso', 'verde', 'blu'],
  result: [[-0.2723826820025445], [9.166346700955668], [-0.6066400766767437]],
  notes: 'notes',
};

const fakeDataList = [{ target: 'A-series', datapoints: [[1]] }, { datapoints: [[0]] }];

//////////////////

let pd;

beforeEach(() => {
  pd = new ProcessData();
  pd.setDataList(dataList);
  pd.setNodeMap(nodeMap);
  pd.setInfluxParameters(influxParameters);
});

test('getStrategy method', () => {
  pd.setConfiguration(svmConfiguration);
  pd.start();
  let res = pd.getCurrentStrategy();
  expect(res).not.toBeNull();
});

test('SVM ProcessData', () => {
  pd.setConfiguration(svmConfiguration);
  pd.start();
  expect(mockSvmPredict).toHaveBeenCalled();
  expect(console.log).not.toHaveBeenCalledWith('You forgot to set one of the parameters');
});

test('RL ProcessData', () => {
  pd.setConfiguration(rlConfiguration);
  pd.start();
  expect(mockRlPredict).toHaveBeenCalled();
  expect(console.log).not.toHaveBeenCalledWith('You forgot to set one of the parameters');
});

test('DataList error', () => {
  pd.setDataList(fakeDataList);
  pd.setConfiguration(rlConfiguration);
  pd.start();
  expect(console.error).toHaveBeenCalledWith('Map not properly set up');
});

test('Missing parameter error', () => {
  pd.start();
  expect(console.error).toHaveBeenCalledWith('You forgot to set one of the parameters');
});
