import { RlPrediction } from './RlPrediction';

describe('RlPrediction tests', () => {
  let predictor: RlPrediction;
  beforeEach(() => {
    predictor = new RlPrediction();
  });

  test('setOptions should set options', () => {
    predictor.setOptions({ options: 'test' });
    expect(predictor.getOptions()).toEqual({ options: 'test' });
  });
});
