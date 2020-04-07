import { AlgorithmPrediction } from '../../model/AlgorithmPrediction';
import { SVM } from 'ml-modules';
import { DataSet, WriteInfluxParameters, SvmJsonConfiguration } from '../../types/types';
import { WriteInflux } from 'model/writeInflux';

export class SvmPrediction implements AlgorithmPrediction {
  private writeInflux: WriteInflux;

  constructor() {}

  predict = (data: DataSet, json: SvmJsonConfiguration, parameters: WriteInfluxParameters): number[][] => {
    const svm: any = new SVM();
    let result: number[][] = [];
    // populate array with results
    // json should contains data + labels <- modify ghiotto's library function setData
    for (let i = 0; i < data.timestamps.length; i++) {
      svm.setData(json);
      result.push(svm.predict([data[i]]));
    }
    return result;
  };
}
