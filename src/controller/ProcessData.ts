import { PerformPrediction } from './PerformPrediction';
import { DataSet } from '../types/DataSet';
import { DataList } from 'types/DataList';

export class ProcessData {
  private strategy: PerformPrediction;
  private data: DataSet;
  private nodeMap: Map<string, string>;

  constructor(strategy: PerformPrediction) {
    this.strategy = strategy;
  }

  setStrategy = (algorithm: PerformPrediction): void => {
    this.strategy = algorithm;
  };

  /**
   * datalist: [
   *   {
   *      target:"CPU",
   *      datapoints: [
   *        [10, 12 //timestamp],
   *        [20, 13 //timestamp],
   *        [30, 14 //timestamp]
   *      ]
   *   },
   *   {
   *      target: "DISK",
   *      datapoints: [
   *        [20, 12 //timestamp],
   *        [40, 13 //timestamp],
   *        [60, 14 //timestamp]
   *      ]
   *   }
   * ]
   */
  // setData returns:
  //  timestamps: [12,13,14]
  //  data: [[10,20],[20,40],[30,60]]

  // nodemap: Map<string, string>
  //  {
  //     "queryA": "CPU"
  //     "queryB": "DISK"
  //  }

  setData = (datalist: DataList[], nodeMap: Map<string, string>): void => {
    // TODO: understand how to setup nodeMap
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

/**
 * let svm = new ProcessSvm();
 * let processor = new ProcessData(svm);
 * processor.setData(datalist, nodeMap);
 * processor.start();
 */
