import { SvmPrediction } from './SvmPrediction';
import { SVM } from 'ml-modules';
import { WriteInflux } from 'model/writeInflux';
import { WriteInfluxParameters } from '../../types/types';

jest.mock('model/writeInflux');

const mockedPredict: any = jest.fn();
const mockedSetData: any = jest.fn();

const params: WriteInfluxParameters = {
  host: 'myinfluxdb',
  port: 'test',
  database: 'test',
  credentials: ['test', 'test'],
  measurement: 'test',
  fieldKey: 'test',
};

jest.mock('ml-modules', () => ({
  SVM: jest.fn(() => ({
    setData: mockedSetData,
    predictData: mockedPredict,
  })),
}));

describe('SvmPrediction tests', () => {
  test('predict method should call setData and predict function from ml-modules', () => {
    let predictor: SvmPrediction = new SvmPrediction();
    predictor.predict(
      {
        data: [
          [1, 2],
          [2, 3],
          [3, 4],
        ],
        timestamps: [1, 2, 3],
      },
      {
        pluginAim: 'test',
        predictors: ['a', 'b'],
        result: { N: 1, D: 1, b: 1, kernelType: 'test', w: [1, 1] },
        notes: 'notes',
      },
      params
    );
    expect(mockedSetData).toBeCalledTimes(1);
    expect(mockedPredict).toBeCalledTimes(3);
  });
});
