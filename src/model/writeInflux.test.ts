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

import * as InfluxData from '../test/integrationTests/writeInfluxData';

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

    it('Constructor database name already present - do not create a new one', () => {
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
      writeInflux.writeArrayToInflux(InfluxData.writeArray, InfluxData.writeTimestamps);
      expect(writeInflux.setupArray).toHaveBeenCalledTimes(1);
    });

    it('WritePoints - correct calls to influx library', () => {
      writeInflux.writePointToInflux(InfluxData.writePoint, InfluxData.writeTimestamp);
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
      writeInflux.setupArray(InfluxData.writeArray, InfluxData.writeTimestamps);
      expect(writeInflux.setupPoint).toHaveBeenCalledTimes(InfluxData.writeArray.length);
    });
  });
});
