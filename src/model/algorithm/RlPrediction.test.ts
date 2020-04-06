import { RlPrediction } from './RlPrediction';
const Regression = require('../../libs/regression');
jest.mock('../../libs/regression');

describe('RlPrediction tests', () => {
  let predictor: RlPrediction;
  beforeEach(() => {
    predictor = new RlPrediction();
  });

  test('setOptions should set options', () => {
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
        result: [
          [1, 2],
          [2, 3],
        ],
        notes: 'notes',
      },
      {
        host: 'test',
        port: 'test',
        database: 'test',
        credentials: ['test', 'test'],
        measurement: 'test',
        fieldKey: 'test',
      }
    );
    expect(Regression.prototype.predict).toBeCalled();
  });
});
