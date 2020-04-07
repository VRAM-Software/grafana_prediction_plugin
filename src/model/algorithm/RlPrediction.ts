import { AlgorithmPrediction } from '../../model/AlgorithmPrediction';
import Regression from '../../libs/regression';
import { DataSet, WriteInfluxParameters } from '../../types/types';
import { WriteInflux } from 'model/writeInflux';
import { JsonConfiguration } from '../../types/JsonConfiguration';

export class RlPrediction implements AlgorithmPrediction {
  private writeInflux: WriteInflux;

  constructor() {
  }

  predict = (data: DataSet, json: JsonConfiguration, parameters: WriteInfluxParameters): number[][] => {
    // add function in regression library => setCoefficients using json.result for RL
    const rl: Regression = new Regression();
    this.writeInflux = new WriteInflux(parameters);
    let result: number[][] = [];
    for (let i = 0; i < data.timestamps.length; i++) {
      for (let j = 0; j < data.data.length; j++) {
        let obj: number[] = data.data[i];
        let x: number = obj[j];
        result.push(rl.predict(x));
      }
    }
    this.writeInflux.writeArrayToInflux(result.flat(), data.timestamps);
    return result;
  };
}
