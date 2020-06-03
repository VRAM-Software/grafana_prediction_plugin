import { ProcessData } from './ProcessData';
import { WriteInfluxParameters, SvmJsonConfiguration, RlJsonConfiguration, DataList } from '../types/types';
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

const dataList: DataList[] = [
  {
    target: 'cpu',
    datapoints: [
      [1, 1],
      [2, 2],
      [3, 3],
    ],
  },
  {
    target: 'disk',
    datapoints: [
      [4, 1],
      [5, 2],
      [6, 3],
    ],
  },
  {
    target: 'fan',
    datapoints: [
      [7, 1],
      [8, 2],
      [9, 3],
    ],
  },
];
const nullDataList: DataList[] = [
  {
    target: 'cpu',
    datapoints: [
      [1, 1],
      [null as any, 2],
      [3, 3],
    ],
  },
  {
    target: 'disk',
    datapoints: [
      [4, 1],
      [null as any, 2],
      [6, 3],
    ],
  },
  {
    target: 'fan',
    datapoints: [
      [7, 1],
      [null as any, 2],
      [9, 3],
    ],
  },
];
const nodeMap: Map<string, string> = new Map()
  .set('cpu', 'weight')
  .set('disk', 'size')
  .set('fan', 'fanz');
const reverseMap: Map<string, string> = new Map()
  .set('cpu', 'fanz')
  .set('disk', 'weight')
  .set('fan', 'size');

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
  predictors: ['weight', 'size', 'fanz'],
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

test('Null values in datalist, should be ignored', () => {
  pd.setConfiguration(svmConfiguration);
  pd.setDataList(nullDataList);
  pd.start();
  expect(console.log).toHaveBeenCalledWith('null numbers, tuple ignored');
});

test('Check that nodeMap is working, direct match', () => {
  pd.setConfiguration(svmConfiguration);
  pd.start();
  expect(pd.data.data).toStrictEqual([
    [1, 4, 7],
    [2, 5, 8],
    [3, 6, 9],
  ]);
});

test('Check that nodeMap is working, reverse match', () => {
  pd.setConfiguration(svmConfiguration);
  pd.setNodeMap(reverseMap);
  pd.start();
  expect(pd.data.data).toStrictEqual([
    [4, 7, 1],
    [5, 8, 2],
    [6, 9, 3],
  ]);
});
