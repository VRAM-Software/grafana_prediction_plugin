import { AlgorithmPrediction } from '../../model/AlgorithmPrediction';
import Regression from '../../libs/regression';
import { DataSet, WriteInfluxParameters, RlJsonConfiguration } from '../../types/types';
import { WriteInflux } from 'model/writeInflux';

export class RlPrediction implements AlgorithmPrediction {
  private writeInflux: WriteInflux;
  private rl: Regression;

  constructor() {
    this.predict = this.predict.bind(this);
  }

  predict(data: DataSet, json: RlJsonConfiguration, parameters: WriteInfluxParameters): number[][] {
    this.rl = new Regression({ numX: json.predictors.length - 1, numY: 1 });
    this.writeInflux = new WriteInflux(parameters);
    this.rl.setCoefficients(json.result);

    let result: number[][] = [];
    for (let i = 0; i < data.timestamps.length; i++) {
      result.push(this.rl.predict(data.data[i]));
    }
    console.log(result);
    this.writeInflux.writeArrayToInflux(result.flat(), data.timestamps);
    return result;
  };
}
