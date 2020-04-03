import { AlgorithmPrediction } from 'model/AlgorithmPrediction';

export class RlPrediction implements AlgorithmPrediction {
  private options: {};
  private timeData: number[];
  private coefficients: number;

  constructor() {}

  setOptions = (option: {}): void => {
    this.options = option;
  };

  setCoefficients = (value: number): void => {
    this.coefficients = value;
  };

  predict = (data: number[], json: {}): {} => {
    return {};
  };
}
