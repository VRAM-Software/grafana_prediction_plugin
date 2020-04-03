import { PerformPrediction } from 'controller/PerformPrediction';
import { RlPrediction } from 'model/algorithm/RlPrediction';

export class ProcessRl implements PerformPrediction {
  private result: {};
  private rlPredicter: RlPrediction;

  constructor() {}

  createPredicterInstance = () => {
    this.rlPredicter = new RlPrediction();
  };

  performPrediction = (datalist: Map<string, number[]>, configuration: {}, nodeMap: Map<string, string>, timeData: number[]): void => {
    if (!this.rlPredicter) {
      this.createPredicterInstance();
    }
    // do operations with data to pass correct data to predictMethod
    // this.rlPredicter.setUpData(datalist: Map<string, number[], ...);
    let res = this.rlPredicter.predict([], configuration);
    this.result = res;
  };
}
