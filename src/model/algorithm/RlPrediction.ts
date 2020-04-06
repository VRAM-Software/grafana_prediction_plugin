import { AlgorithmPrediction } from '../../model/AlgorithmPrediction';
import Regression from '../../libs/regression';
import { DataSet } from '../../types/DataSet';

export class RlPrediction implements AlgorithmPrediction {
  private options: {
    kernel: {
      linear: true;
    };
    karpathy: true;
  };
  private coefficients: number[][];

  constructor() {}

  getOptions = (): {} => {
    return this.options;
  };

  setCoefficients = (value: number[][]): void => {
    this.coefficients = value;
  };

  // TODO
  // data: [[10,20],[20,40],[30,60]]
  predict = (data: DataSet, json: {}): number[][] => {
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
