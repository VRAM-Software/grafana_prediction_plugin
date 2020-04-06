import { PerformPrediction } from '../../controller/PerformPrediction';
import { RlPrediction } from '../../model/algorithm/RlPrediction';
import { DataSet } from '../../types/DataSet';

export class ProcessRl implements PerformPrediction {
  private rlPredicter: RlPrediction;

  constructor() {}

  createPredicterInstance = () => {
    this.rlPredicter = new RlPrediction();
  };

  performPrediction = (data: DataSet, configuration: {}, nodeMap: Map<string, string>): number[][] => {
    if (!this.rlPredicter) {
      this.createPredicterInstance();
    }

    let res = this.rlPredicter.predict(data, configuration);
    return res;
  };
}
