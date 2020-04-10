import { PerformPrediction } from '../../controller/PerformPrediction';
import { SvmPrediction } from '../../model/algorithm/SvmPrediction';
import { DataSet, WriteInfluxParameters, SvmJsonConfiguration } from '../../types/types';

export class ProcessSvm implements PerformPrediction {
  private svmPredicter: SvmPrediction;

  constructor() {
    this.svmPredicter = new SvmPrediction();
    this.performPrediction = this.performPrediction.bind(this);
  }

  performPrediction(data: DataSet, configuration: SvmJsonConfiguration, influxParameters: WriteInfluxParameters): number[][] {
    let res = this.svmPredicter.predict(data, configuration, influxParameters);
    return res;
  }
}
