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
    predictor.predict([1, 2, 3], { N: 1, b: 1, D: [1, 2], w: 1, kernelType: 'test' });
    expect(mockedSetData).toBeCalledWith([1, 2, 3], { N: 1, b: 1, D: [1, 2], w: 1, kernelType: 'test' });
    expect(mockedPredict).toBeCalledTimes(3);
  });
});
