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

    for (let j = 0; j < this.dataList[0].datapoints.length; ++j) {
      temp = [this.nodeMap.size];

      this.buildIndexesMap().forEach((predictorID, queryID) => {
        let d = this.dataList[queryID].datapoints[j];

        if (d[0]) {
          if (!timestamps.includes(d[1])) {
            timestamps.push(d[1]);
          }
          temp[predictorID] = d[0];
        } else {
          console.log('null numbers, tuple ignored');
        }
      });

      data.push(temp);
    }

    this.data = {
      data: data.filter(e => e.length),
      timestamps: timestamps,
    };
  };

  private buildIndexesMap = (): Map<number, number> => {
    let indexesMap: Map<number, number> = new Map();
    this.nodeMap.forEach((value, key) => {
      let targetIndex = -1;
      let predictorIndex = -1;
      for (let i = 0; i < this.dataList.length; ++i) {
        if (this.dataList[i].target === key) {
          targetIndex = i;
        }
      }

      for (let i = 0; i < this.configuration.predictors.length; ++i) {
        if (this.configuration.predictors[i] === value) {
          predictorIndex = i;
        }
      }

      if (targetIndex < 0 || predictorIndex < 0) {
        console.error('Map not properly set up');
      } else {
        indexesMap.set(targetIndex, predictorIndex);
      }
    });
    return indexesMap;
  };

  getCurrentStrategy = (): PerformPrediction => {
    return this.strategy;
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

  start = (): any => {
    const notDefined = value => value == null;
    if ([this.dataList, this.configuration, this.nodeMap, this.influxParameters].some(notDefined)) {
      console.error('You forgot to set one of the parameters');
    } else {
      this.setupData();
      this.setStrategy(this.configuration.pluginAim);
      return this.strategy.performPrediction(this.data, this.configuration, this.influxParameters);
    }
  };
}
