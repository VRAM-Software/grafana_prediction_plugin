import { AlgorithmPrediction } from 'model/AlgorithmPrediction';

export class RlPrediction implements AlgorithmPrediction {
  private options: {};
  private timeData: number[];

  constructor() {}

  private setOptions = (option: {}): void => {};

  private setCoefficients = (value: number): void => {};

  predict = (data: number[], json: {}): {} => {
    return {};
  };
}
