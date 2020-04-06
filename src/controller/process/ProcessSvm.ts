import { PerformPrediction } from '../../controller/PerformPrediction';
import { SvmPrediction } from '../../model/algorithm/SvmPrediction';
import { DataSet, WriteInfluxParameters } from '../../types/types';

export class ProcessSvm implements PerformPrediction {
  private svmPredicter: SvmPrediction;

  constructor() {
    this.svmPredicter = new SvmPrediction();
  }

  performPrediction = (data: DataSet, configuration: {}, influxParameters: WriteInfluxParameters): number[][] => {
    let res = this.svmPredicter.predict(data, configuration, influxParameters);
    return res;
  };
}
