import { AlgorithmPrediction } from '../../model/AlgorithmPrediction';
import { SVM } from 'ml-modules';
import { DataSet } from '../../types/DataSet';

export class SvmPrediction implements AlgorithmPrediction {
  private options: { numX: 1; numY: 1 };

  constructor() {}

  getOptions = (): {} => {
    return this.options;
  };

  predict = (data: DataSet, json: {}): number[][] => {
    const svm: any = new SVM();
    // change this function call to take as a parameter the timestamp
    // atm we calculate labels: [] in setData but it's not right since
    // we have labels = timestamps <- modify regression library
    let result: number[][] = [];
    for (let i = 0; i < data.timestamps.length; i++) {
      svm.setData([data[i]], json);
      result.push(svm.predict([data[i]]));
    }

    return result;
  };
}
