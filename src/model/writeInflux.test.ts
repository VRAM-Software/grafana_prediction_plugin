/**
 * File: panelCtrl.test.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-04-13
 * Description: Test file for writeInflux.ts
 */

import { WriteInflux } from './writeInflux';
import { WriteInfluxParameters } from '../types/writeInfluxParameters';
import { InfluxDB } from 'influx';

const mockGetDatabaseNames = jest.fn().mockImplementation(async () => {
  return ['mockedDatabaseName'];
});

const mockCreateDatabase = jest.fn().mockImplementation(async () => {
  return {};
});

const mockWritePoints = jest.fn().mockImplementation(async () => {
  return {};
});

jest.mock('influx', () => {
  return {
    InfluxDB: jest.fn().mockImplementation(() => {
      return {
        getDatabaseNames: mockGetDatabaseNames,
        createDatabase: mockCreateDatabase,
        writePoints: mockWritePoints,
      };
    }),
  };
});

let influx: InfluxDB;
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

describe('WriteInflux Unit tests', () => {
  describe('Constructor unit tests', () => {
    beforeEach(() => {
      InfluxDB.mockClear();
      this.influx = new InfluxDB();
    });

    it('Constructor host is empty - throw error', () => {
      expect(() => {
        writeInflux = new WriteInflux({
          host: '',
          port: '8086',
          database: 'testDB',
          credentials: ['root', 'root'],
          measurement: 'CPU',
          fieldKey: 'CPULoadPercentage',
        });
      }).toThrow(Error);
    });

    it('Constructor port is empty - throw error', () => {
      expect(() => {
        writeInflux = new WriteInflux({
          host: 'http://localhost',
          port: '',
          database: 'testDB',
          credentials: ['root', 'root'],
          measurement: 'CPU',
          fieldKey: 'CPULoadPercentage',
        });
      }).toThrow(Error);
    });

    it('Constructor database is empty - throw error', () => {
      expect(() => {
        writeInflux = new WriteInflux({
          host: 'http://localhost',
          port: '8086',
          database: '',
          credentials: ['root', 'root'],
          measurement: 'CPU',
          fieldKey: 'CPULoadPercentage',
        });
      }).toThrow(Error);
    });

    it('Constructor database name already present - not create a new one', () => {
      writeInflux = new WriteInflux({
        host: 'http://localhost',
        port: '8086',
        database: 'mockedDatabaseName',
        credentials: ['root', 'root'],
        measurement: 'CPU',
        fieldKey: 'CPULoadPercentage',
      });
      expect(this.influx.getDatabaseNames).toBeCalledTimes(1);
      expect(this.influx.createDatabase).not.toBeCalled();
    });
  });

  describe('Write unit tests', () => {
    beforeEach(() => {
      InfluxDB.mockClear();
      writeInflux = new WriteInflux(params);
      writeInflux.setupArray = jest.fn();
      writeInflux.setupPoint = jest.fn();
    });

    it('WriteArray - correct calls to influx library', () => {
      writeInflux.writeArrayToInflux(writeArray, writeTimestamps);
      expect(writeInflux.setupArray).toHaveBeenCalledTimes(1);
    });

    it('WritePoints - correct calls to influx library', () => {
      writeInflux.writePointToInflux(writePoint, writeTimestamp);
      expect(writeInflux.setupPoint).toHaveBeenCalledTimes(1);
    });
  });

  describe('SetupArray unit tests', () => {
    beforeEach(() => {
      InfluxDB.mockClear();
      writeInflux = new WriteInflux(params);
      writeInflux.setupPoint = jest.fn();
    });

    it('SetupArray - correct calls to setupPoint', () => {
      writeInflux.setupArray(writeArray, writeTimestamps);
      expect(writeInflux.setupPoint).toHaveBeenCalledTimes(writeArray.length);
    });
  });
});
