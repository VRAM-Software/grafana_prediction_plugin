import { AlgorithmPrediction } from '../../model/AlgorithmPrediction';
import { SVM } from 'ml-modules';
import { DataSet, WriteInfluxParameters, SvmJsonConfiguration } from '../../types/types';
import { WriteInflux } from 'model/writeInflux';

export class SvmPrediction implements AlgorithmPrediction {
  private writeInflux: WriteInflux;
  private svm: any;

  constructor() {}

  predict = (data: DataSet, json: SvmJsonConfiguration, parameters: WriteInfluxParameters): number[][] => {
    this.svm = new SVM();
    this.writeInflux = new WriteInflux(parameters);
    this.svm.setData(json);

    console.log(data);
    let result: number[][] = [];
    for (let i = 0; i < data.timestamps.length; i++) {
      result.push(this.svm.predict(data.data[i]));
    }
    console.log(result);
    this.writeInflux.writeArrayToInflux(result.flat(), data.timestamps);
    return result;
  };
}
