import { PerformPrediction } from '../../controller/PerformPrediction';
import { RlPrediction } from '../../model/algorithm/RlPrediction';
import { DataSet, RlJsonConfiguration, WriteInfluxParameters } from '../../types/types';

export class ProcessRl implements PerformPrediction {
  private rlPredicter: RlPrediction;

  constructor() {
    this.rlPredicter = new RlPrediction();
  }

  performPrediction = (data: DataSet, configuration: RlJsonConfiguration, influxParameters: WriteInfluxParameters): number[][] => {
    let res = this.rlPredicter.predict(data, configuration, influxParameters);
    return res;
  };
}
