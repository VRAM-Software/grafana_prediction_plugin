import { AlgorithmPrediction } from '../../model/AlgorithmPrediction';
import { SVM } from 'ml-modules';
import { DataSet, WriteInfluxParameters, SvmJsonConfiguration } from '../../types/types';
import { WriteInflux } from 'model/writeInflux';

export class SvmPrediction implements AlgorithmPrediction {
  private writeInflux: WriteInflux;
  private svm: any;

  constructor() {}

  // [0,1,2]
  // [[1,2],[2,3],[3,4]]

  predict = (data: DataSet, json: SvmJsonConfiguration, parameters: WriteInfluxParameters): number[][] => {
    this.svm = new SVM();
    this.writeInflux = new WriteInflux(parameters);
    let result: number[][] = [];
    // populate array with results
    // json should contains data + labels <- modify ghiotto's library function setData
    for (let i = 0; i < data.timestamps.length; i++) {
      this.svm.setData(json);
      result.push(this.svm.predict([data.data[i]]));
    }
    this.writeInflux.writeArrayToInflux(result.flat(), data.timestamps);
    return result;
  };
}
