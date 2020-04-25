/**
 * File: panelCtrl.test.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-04-13
 * Description: Test file for writeInflux.ts
 */

import { WriteInflux } from './writeInflux';
import { WriteInfluxParameters } from '../types/writeInfluxParameters';
import { InfluxDB } from 'influx';
import * as InfluxData from '../test/integrationTests/writeInfluxData';

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

describe('WriteInflux Unit tests', () => {
  let influx: InfluxDB;
  let writeInflux: WriteInflux;
  let params: WriteInfluxParameters;

  describe('Constructor unit tests', () => {
    beforeEach(() => {
      InfluxDB.mockClear();
      this.influx = new InfluxDB();
      this.params = {
        host: 'http://localhost',
        port: '8086',
        database: 'testDB',
        credentials: ['root', 'root'],
        measurement: 'CPU',
        fieldKey: 'CPULoadPercentage',
      };
    });

    it('Constructor host is empty - throw error', () => {
      this.params.host = '';
      expect(() => {
        this.writeInflux = new WriteInflux(this.params);
      }).toThrow(Error);
    });

    it('Constructor port is empty - throw error', () => {
      this.params.port = '';
      expect(() => {
        this.writeInflux = new WriteInflux(this.params);
      }).toThrow(Error);
    });

    it('Constructor database is empty - throw error', () => {
      this.params.database = '';
      expect(() => {
        this.writeInflux = new WriteInflux(this.params);
      }).toThrow(Error);
    });

    it('Constructor measurement is empty - throw error', () => {
      this.params.measurement = '';
      expect(() => {
        this.writeInflux = new WriteInflux(this.params);
      }).toThrow(Error);
    });

    it('Constructor fieldKey is empty - throw error', () => {
      this.params.fieldKey = '';
      expect(() => {
        this.writeInflux = new WriteInflux(this.params);
      }).toThrow(Error);
    });

    it('Constructor database name already present - do not create a new one', () => {
      this.params.database = 'mockedDatabaseName';
      this.writeInflux = new WriteInflux(this.params);
      expect(this.influx.getDatabaseNames).toBeCalledTimes(1);
      expect(this.influx.createDatabase).not.toBeCalled();
    });
  });

  describe('Write unit tests', () => {
    beforeEach(() => {
      InfluxDB.mockClear();
      this.writeInflux = new WriteInflux(this.params);
      this.writeInflux.setupArray = jest.fn();
      this.writeInflux.setupPoint = jest.fn();
    });

    it('WriteArray - correct calls to influx library', () => {
      this.writeInflux.writeArrayToInflux(InfluxData.writeArray, InfluxData.writeTimestamps);
      expect(this.writeInflux.setupArray).toHaveBeenCalledTimes(1);
    });

    it('WritePoints - correct calls to influx library', () => {
      this.writeInflux.writePointToInflux(InfluxData.writePoint, InfluxData.writeTimestamp);
      expect(this.writeInflux.setupPoint).toHaveBeenCalledTimes(1);
    });
  });

  describe('SetupArray unit tests', () => {
    beforeEach(() => {
      InfluxDB.mockClear();
      this.writeInflux = new WriteInflux(this.params);
      this.writeInflux.setupPoint = jest.fn();
    });

    it('SetupArray - correct calls to setupPoint', () => {
      this.writeInflux.setupArray(InfluxData.writeArray, InfluxData.writeTimestamps);
      expect(this.writeInflux.setupPoint).toHaveBeenCalledTimes(InfluxData.writeArray.length);
    });
  });
});
