import { PerformPrediction } from 'controller/PerformPrediction';
import { SvmPrediction } from 'model/algorithm/SvmPrediction';

export class ProcessSvm implements PerformPrediction {
  private svmPredicter: SvmPrediction;

  constructor() {}

  createPredicterInstance = () => {
    this.svmPredicter = new SvmPrediction();
  };

  performPrediction = (datalist: Map<string, number[]>, configuration: {}, nodeMap: Map<string, string>, timeData: number[]): {} => {
    if (!this.svmPredicter) {
      this.createPredicterInstance();
    }
    // do operations with data to pass correct data to predictMethod
    // this.rlPredicter.setUpData(datalist: Map<string, number[], ...);
    let res = this.svmPredicter.predict([], configuration);
    return res;
  };
}
