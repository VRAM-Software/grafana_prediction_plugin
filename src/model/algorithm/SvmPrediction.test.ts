import { SvmPrediction } from './SvmPrediction';
import { SVM } from 'ml-modules';
import { WriteInflux } from 'model/writeInflux';
import { InfluxDB, IPoint } from 'influx';

jest.mock('influx');

const mockedPredict: any = jest.fn();
const mockedSetData: any = jest.fn();

jest.mock('ml-modules', () => ({
  SVM: jest.fn(() => ({
    setData: mockedSetData,
    predict: mockedPredict,
  })),
}));

describe('SvmPrediction tests', () => {
  let predictor: SvmPrediction;
  beforeEach(() => {
    predictor = new SvmPrediction();
  });

  test('predict method should call setData and predict function from ml-modules', () => {
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
      {
        host: 'myinfluxdb',
        port: 'test',
        database: 'test',
        credentials: ['test', 'test'],
        measurement: 'test',
        fieldKey: 'test',
      }
    );
    expect(mockedSetData).toBeCalledTimes(3);
    expect(mockedPredict).toBeCalledTimes(3);
  });
});
