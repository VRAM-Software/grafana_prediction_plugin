import { PerformPrediction } from '../../controller/PerformPrediction';
import { SvmPrediction } from '../../model/algorithm/SvmPrediction';
import { DataSet } from '../../types/DataSet';

export class ProcessSvm implements PerformPrediction {
  private svmPredicter: SvmPrediction;

  constructor() {}

  createPredicterInstance = () => {
    this.svmPredicter = new SvmPrediction();
  };

  performPrediction = (data: DataSet, configuration: {}, nodeMap: Map<string, string>): number[][] => {
    if (!this.svmPredicter) {
      this.createPredicterInstance();
    }

    let res = this.svmPredicter.predict(data, configuration);
    return res;
  };
}
