export interface JsonConfiguration {
  pluginAim: string;
  predictors: string[];
  result: {};
  notes: string;
}

export interface SvmJsonConfiguration extends JsonConfiguration {
  result: {
    N: number;
    D: number;
    b: number;
    kernelType: string;
    w: number[];
  };
}

export interface RlJsonConfiguration extends JsonConfiguration {
  result: number[][];
}
