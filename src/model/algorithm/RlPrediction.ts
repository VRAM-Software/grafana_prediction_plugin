import { AlgorithmPrediction } from '../../model/AlgorithmPrediction';
import Regression from '../../libs/regression';
import { DataSet, WriteInfluxParameters } from '../../types/types';
import { JsonConfiguration } from '../../types/JsonConfiguration';

export class RlPrediction implements AlgorithmPrediction {

  constructor() {}

  predict = (data: DataSet, json: JsonConfiguration, parameters: WriteInfluxParameters): number[][] => {
    // add function in regression library => setCoefficients using json.result for RL
    const rl: Regression = new Regression();
    let result: number[][] = [];
    for (let i = 0; i < data.timestamps.length; i++) {
      for (let j = 0; j < data.data.length; j++) {
        let obj: number[] = data.data[i];
        let x: number = obj[j];
        result.push(rl.predict(x));
      }
    }
    return result;
  };
}
