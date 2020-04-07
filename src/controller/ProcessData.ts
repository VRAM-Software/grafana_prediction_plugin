import { PerformPrediction } from './PerformPrediction';
import { DataSet, DataList, WriteInfluxParameters, JsonConfiguration } from '../types/types';
import { ProcessSvm } from './process/ProcessSvm';
import { ProcessRl } from './process/ProcessRl';

export class ProcessData {
  private strategy: PerformPrediction;
  private dataList: DataList[];
  private nodeMap: Map<string, string>;
  private influxParameters: WriteInfluxParameters;
  private configuration: JsonConfiguration;
  private data: DataSet;

  constructor() {}

  private setupData = (): void => {
    let timestamps: number[] = [];
    let data: number[][] = [];
    let temp: number[] = [];
    let predictors: string[] = [];
    let j = 0;

    while (j < this.dataList[0].datapoints.length) {
      temp = [];
      for (let i = 0; i < this.dataList.length; i++) {
        if (!this.dataList[i].target) {
          console.error('Map not properly set up');
        } else {
          predictors.push(this.nodeMap.get(this.dataList[i].target) ?? '');
        }
        let dp = this.dataList[i].datapoints;
        let d = dp[j];
        if (d[0]) {
          if (!timestamps.includes(d[1])) {
            timestamps.push(d[1]);
          }
          temp.push(d[0]);
        } else {
          console.log("null numbers, tuple ignored");
        }
        
      }
      data.push(temp);
      j += 1;
    }

    console.log(this.data);
    this.data = {
      data: data.filter(e => e.length),
      timestamps: timestamps,
    };
  };

  setStrategy = (algorithm: string): void => {
    if (algorithm === 'svm') {
      this.strategy = new ProcessSvm();
    }
    if (algorithm === 'rl') {
      this.strategy = new ProcessRl();
    }
  };

  setDataList = (data: any) => {
    this.dataList = [];
    data.forEach(item => {
      this.dataList.push({
        target: item.target,
        datapoints: item.datapoints,
      });
    });
  };

  setNodeMap = (nodeMap: Map<string, string>) => {
    this.nodeMap = nodeMap;
  };

  setInfluxParameters = (params: WriteInfluxParameters) => {
    this.influxParameters = params;
  };

  setConfiguration = (conf: JsonConfiguration) => {
    this.configuration = conf;
  };

  start = (): void => {
    const notDefined = value => value == null;
    if ([this.dataList, this.configuration, this.nodeMap, this.influxParameters].some(notDefined)) {
      console.error('You forgot to set one of the parameters');
    } else {
      this.setupData();
      this.setStrategy(this.configuration.pluginAim);
      this.strategy.performPrediction(this.data, this.configuration, this.influxParameters);
    }
  };
}
