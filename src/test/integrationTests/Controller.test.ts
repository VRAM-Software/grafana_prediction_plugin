import { ProcessData } from '../../controller/ProcessData';
import { ProcessRl } from '../../controller/process/ProcessRl';
import { ProcessSvm } from '../../controller/process/ProcessSvm';
import { RlPrediction } from '../../model/algorithm/RlPrediction';
import { SvmPrediction } from '../../model/algorithm/SvmPrediction';
import Regression from '../../libs/regression';
import { WriteInfluxParameters, DataList, SvmJsonConfiguration, RlJsonConfiguration, DataSet } from '../../types/types';

jest.mock('model/writeInflux');

const mockedPredict: any = jest.fn().mockImplementation(() => {
  return 32;
});
const mockedSetData: any = jest.fn();

jest.mock('ml-modules', () => ({
  SVM: jest.fn(() => ({
    setData: mockedSetData,
    predictData: mockedPredict,
  })),
}));

const params: WriteInfluxParameters = {
  host: 'myinfluxdb',
  port: 'test',
  database: 'test',
  credentials: ['test', 'test'],
  measurement: 'test',
  fieldKey: 'test',
};

const datalist: DataList[] = [
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
];

const svmJsonConfiguration: SvmJsonConfiguration = {
  pluginAim: 'svm',
  predictors: ['weight', 'size'],
  result: {
    N: 12,
    D: 12,
    b: 12,
    kernelType: 'linear',
    w: [12, 12],
  },
  notes: 'testNotes',
};

const rlJsonConfiguration: RlJsonConfiguration = {
  pluginAim: 'rl',
  predictors: ['weight', 'size'],
  result: [
    [12, 13],
    [13, 14],
  ],
  notes: 'testNotes',
};

const newMap: Map<string, string> = new Map().set('cpu', 'idQuery1').set('disk', 'idQuery2');

describe('Integration test for the prediction with influx DB mocked', () => {
  let pd;
  beforeEach(() => {
    pd = new ProcessData();
    pd.setDataList(datalist);
    pd.setInfluxParameters(params);
    pd.setNodeMap(newMap);
  });

  test('ProcessSvm correctly calls svm predict function and returns a result', () => {
    pd.setConfiguration(svmJsonConfiguration);
    expect(pd.start()).toEqual([32, 32, 32]);
  });

  test('ProcessRl correctly calls rl predict funciton and returns a result', () => {
    pd.setConfiguration(rlJsonConfiguration);
    expect(pd.start()).toEqual([
      [25, 27],
      [38, 41],
      [51, 55],
    ]);
  });
});
