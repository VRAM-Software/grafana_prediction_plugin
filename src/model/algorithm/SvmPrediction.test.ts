import { SvmPrediction } from './SvmPrediction';
import { SVM } from 'ml-modules';

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
      { N: 1, b: 1, D: [1, 2], w: 1, kernelType: 'test' }
    );
    expect(mockedSetData).toBeCalledTimes(3);
    expect(mockedPredict).toBeCalledTimes(3);
  });
});
