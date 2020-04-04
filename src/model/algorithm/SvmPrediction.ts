import { AlgorithmPrediction } from 'model/AlgorithmPrediction';
import { SVM } from 'ml-modules';
import { DataSet } from 'types/DataSet';

export class SvmPrediction implements AlgorithmPrediction {
  private options: {};

  constructor() {}

  predict = (data: DataSet, json: {}): number[][] => {
    const svm: any = new SVM();
    // change this function call to take as a parameter the timestamp
    // atm we calculate labels: [] in setData but it's not right since
    // we have labels = timestamps
    // TODO: understand what labels we need to use for SVM cause it's needed for
    //       predict method

    //  timestamps: [12,13,14]
    //  data: [[10,20],[20,40],[30,60]]
    //  i need to predict for each timestamp
    let result: number[][] = [];
    for (let i = 0; i < data.timestamps.length; i++) {
      svm.setData([data[i]], json);
      result.push(svm.predict([data[i]]));
    }

    return result;
  };
}
