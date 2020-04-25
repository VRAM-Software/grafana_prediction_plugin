/**
 * File: writeInflux.test.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-04-11
 * Description: Integration tests for writeInflux class, performs real writes to influxDB
 */

import { WriteInflux } from '../../model/writeInflux';
import { WriteInfluxParameters } from '../../types/writeInfluxParameters';
import * as InfluxData from './writeInfluxData';

let writeInflux: WriteInflux;

const params: WriteInfluxParameters = {
  host: 'http://localhost',
  port: '8086',
  database: 'testDB',
  credentials: ['root', 'root'],
  measurement: 'CPU',
  fieldKey: 'CPULoadPercentage',
};

describe('WriteInflux Integration Test', () => {
  it('Constructor - No error', () => {
    expect(() => {
      writeInflux = new WriteInflux(params);
      console.log('INTEGRATION CONSTRUCTOR');
    }).not.toThrow(Error);
  });

  describe('Write methods', () => {
    it('Write array - No error', () => {
      expect(() => {
        writeInflux.writePointToInflux(InfluxData.writePoint, InfluxData.writeTimestamp);
      }).not.toThrow(Error);
    });

    it('Write point - No error', () => {
      expect(() => {
        writeInflux.writeArrayToInflux(InfluxData.writeArray, InfluxData.writeTimestamps);
      }).not.toThrow(Error);
    });
  });
});
