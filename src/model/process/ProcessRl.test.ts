import { ProcessRl } from './ProcessRl';

describe('ProcessRl tests', () => {
  let process: ProcessRl;
  beforeEach(() => {
    process = new ProcessRl();
  });

  test('setOptions should set options', () => {
    let datalist: Map<string, number[]> = new Map<string, number[]>();
    datalist.set('test', [1, 2, 3]);
    let nodemap: Map<string, string> = new Map<string, string>();
    nodemap.set('node', 'value');

    process.performPrediction(datalist, {}, nodemap, [1, 3]);
    expect(process.getResult()).toEqual([]);
  });
});
