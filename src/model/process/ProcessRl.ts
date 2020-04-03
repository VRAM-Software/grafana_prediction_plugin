import { PerformPrediction } from 'model/PerformPrediction';

export class ProcessRl implements PerformPrediction {
  private result: number[];

  constructor() {}

  performPrediction = (datalist: Map<string, number[]>, configuration: {}, nodeMap: Map<string, string>, timeData: number[]): void => {
    let res: number[] = [];
    this.result = res;
  };
}
