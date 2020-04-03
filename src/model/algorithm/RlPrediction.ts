import { AlgorithmPrediction } from 'model/AlgorithmPrediction';
import Regression from '../../libs/regression';

export class RlPrediction implements AlgorithmPrediction {
  private options: {};
  private timeData: number[];
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

  // data: {x: [1,2,3], y: [1]}
  predict = (data: {}, json: {}): {} => {
    const rl: Regression = new Regression();
    return rl.hypothesize(data);
  };
}
