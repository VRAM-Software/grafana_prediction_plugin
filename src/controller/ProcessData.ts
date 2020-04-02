import { PerformPrediction } from '../model/PerformPrediction';

export class ProcessData {
  private strategy: PerformPrediction;
  private data: Map<string, number>;
  constructor(strategy: PerformPrediction) {
    this.strategy = strategy;
  }
  
  setStrategy = (algorithm: PerformPrediction): void => {
    this.strategy = algorithm;
  };

  setData = (datalist: Map<string, number[]>, configuration: {}, nodeMap: Map<string, string>): void => {};
}
