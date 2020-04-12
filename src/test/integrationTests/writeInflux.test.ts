/**
 * File: writeInflux.test.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-04-11
 * Description: Integration tests for writeInflux class, performs real writes to influxDB
 */

import { WriteInflux } from '../../model/writeInflux';
import { WriteInfluxParameters } from '../../types/writeInfluxParameters';

let writeInflux: WriteInflux;

const params: WriteInfluxParameters = {
  host: 'http://localhost',
  port: '8086',
  database: 'testDB',
  credentials: ['root', 'root'],
  measurement: 'CPU',
  fieldKey: 'CPULoadPercentage',
};

const writeArray: number[] = [15, 16, 14, 14, 15, 18, 25, 40, 70, 95, 90, 94, 93, 83, 70, 65, 55, 40, 30, 15, 14, 16];
const writeTimestamps: number[] = [
  1586617266639,
  1586617272774,
  1586617277593,
  1586617282042,
  1586617286310,
  1586617290435,
  1586617294594,
  1586617298765,
  1586617302243,
  1586617306319,
  1586617311845,
  1586617317405,
  1586617322157,
  1586617330424,
  1586617334539,
  1586617339167,
  1586617345629,
  1586617350869,
  1586617357056,
  1586617362786,
  1586617369878,
  1586617375724,
];

const writePoint = 23;
const writeTimestamp = 1586617851266;

describe('NetUpdater NetWriter Integration Test', () => {
  it('Constructor - No error', () => {
    let error = false;
    try {
      writeInflux = new WriteInflux(params);
    } catch (err) {
      error = true;
    }
    expect(error).toBeFalsy();
  });

  describe('Write methods', () => {
    it('Write array - No error', () => {
      let error = false;
      try {
        writeInflux.writePointToInflux(writePoint, writeTimestamp);
      } catch (err) {
        error = true;
      }
      expect(error).toBeFalsy();
    });

    it('Write point - No error', () => {
      let error = false;
      try {
        writeInflux.writeArrayToInflux(writeArray, writeTimestamps);
      } catch (err) {
        error = true;
      }
      expect(error).toBeFalsy();
    });
  });
});
