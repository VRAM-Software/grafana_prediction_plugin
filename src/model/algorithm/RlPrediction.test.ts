import { RlPrediction } from './RlPrediction';
import { WriteInfluxParameters } from '../../types/types';
import { WriteInflux } from 'model/writeInflux';
const Regression = require('../../libs/regression'); 
jest.mock('../../libs/regression');
jest.mock('model/writeInflux');

const params: WriteInfluxParameters = {
  host: 'myinfluxdb',
  port: 'test',
  database: 'test',
  credentials: ['test', 'test'],
  measurement: 'test',
  fieldKey: 'test',
}

describe('RlPrediction tests', () => {
  test('setOptions should set options', () => { 
    let predictor: RlPrediction = new RlPrediction(params);
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
      }
    );
    expect(Regression.prototype.predict).toBeCalled();
  });
});
