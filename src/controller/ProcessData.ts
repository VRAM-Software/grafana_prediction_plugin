import { PerformPrediction } from './PerformPrediction';
import { DataSet } from '../types/DataSet';
import { DataList } from '../types/DataList';

export class ProcessData {
  private strategy: PerformPrediction;
  private data: DataSet;
  private nodeMap: Map<string, string>;

  constructor() {}

  setStrategy = (algorithm: PerformPrediction): void => {
    this.strategy = algorithm;
  };

  setData = (datalist: DataList[], nodeMap: Map<string, string>): void => {
    let timestamps: number[] = [];
    let data: number[][] = [];
    let j = 0;
    let temp: number[] = [];

    while (j < datalist[0].datapoints.length) {
      temp = [];
      for (let i = 0; i < datalist.length; i++) {
        let dp = datalist[i].datapoints;
        let d = dp[j];
        if (!timestamps.includes(d[1])) {
          timestamps.push(d[1]);
        }
        temp.push(d[0]);
      }
      data.push(temp);
      j += 1;
    }

    this.data = {
      data: data,
      timestamps: timestamps,
    };
  };

  start = (configuration: {}): void => {
    this.strategy.performPrediction(this.data, configuration, this.nodeMap);
  };
}
