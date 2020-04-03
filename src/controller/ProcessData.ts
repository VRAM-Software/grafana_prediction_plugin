import { PerformPrediction } from './PerformPrediction';

export class ProcessData {
  private strategy: PerformPrediction;
  private data: number[][];
  private timeStamps: Map<number, number>;
  constructor(strategy: PerformPrediction) {
    this.strategy = strategy;
  }

  setStrategy = (algorithm: PerformPrediction): void => {
    this.strategy = algorithm;
  };

  // Constructs
  // datalist = {
  //  cpu: [1,2,3,4,5]
  //  disk: [1,2,3,4,5]
  //  ram: [1,2,3,4,5]
  //  timestamp: [0,1,2,3,4]
  // }

  // =>
  // [cpu, disk, ram]
  // [1,   1,    1] | T = 0
  // [2,   2,    2] | T = 1
  // [3,   3,    3] | T = 2
  // [4,   4,    4] | T = 3
  // [5,   5,    5] | T = 4

  // extract Data
  // extract TimeStamps
  // i can have N properties in object datalist
  // for each of them i have to get the value
  // assuming timestamp is last array

  createTimeDataMap = (timestamps: number[]): Map<number, number> => {
    let map = new Map();
    for (let i = 0; i < timestamps.length; i++) {
      map.set(i, timestamps[i]);
    }
    return map;
  };

  createData = (datalist: {}, propNames: string[], timeStamps: number[]): number[][] => {
    let array: number[][] = [];
    let temp: number[] = [];
    for (let i = 0; i < timeStamps.length; i++) {
      temp = [];
      for (let j = 0; j < propNames.length - 1; i++) {
        temp.push(timeStamps[i][Object.keys(timeStamps[i])[j]]);
      }
      array.push(temp);
    }
    return array;
  };

  prepareDatalist = (datalist: {}): void => {
    let propNames: string[] = Object.getOwnPropertyNames(datalist);
    let timestampArray: number[] = datalist[propNames[propNames.length - 1]];
    this.timeStamps = this.createTimeDataMap(timestampArray);
    this.data = this.createData(datalist, propNames, timestampArray);
  };

  setData = (datalist: object[], configuration: {}, nodeMap: Map<string, string>): void => {
    this.prepareDatalist(datalist);
    this.strategy.performPrediction(this.data, configuration, nodeMap, []);
  };
}
