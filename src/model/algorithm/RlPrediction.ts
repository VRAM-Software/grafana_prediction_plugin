import { AlgorithmPrediction } from 'model/AlgorithmPrediction';
import Regression from '../../libs/regression';
import { DataSet } from 'types/DataSet';

export class RlPrediction implements AlgorithmPrediction {
  private options: {};
  // aren't coeffiecients the results?
  private coefficients: number;

  constructor() {}

  getOptions = (): {} => {
    return this.options;
  };

  setOptions = (option: {}): void => {
    this.options = option;
  };

  setCoefficients = (value: number): void => {
    this.coefficients = value;
  };

  // TODO
  predict = (data: DataSet, json: {}): {} => {
    const rl: Regression = new Regression();
    return rl.hypothesize(data.data[1]);
  };
}
