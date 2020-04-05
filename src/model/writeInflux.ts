/**
 * File: writeInflux.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-04-04
 * Description: Class to write to influxDB
 */
import { InfluxDB, IPoint } from 'influx';
import { WriteInfluxParameters } from '../types/writeInfluxParameters';

export class WriteInflux {
  private readonly datasource: string;
  private readonly influx: InfluxDB;

  private readonly parameters: WriteInfluxParameters;

  constructor(parameters: WriteInfluxParameters) {
    if (parameters.host == null || parameters.host.length === 0) {
      throw new Error('WriteInflux - invalid host parameter');
    }
    if (parameters.port == null || parameters.port.length === 0) {
      throw new Error('WriteInflux - invalid port parameter');
    }
    if (parameters.database == null || parameters.database.length === 0) {
      throw new Error('WriteInflux - invalid defaultDB parameter');
    }

    this.parameters = parameters;

    const dsn: URL = new URL(parameters.host);
    dsn.port = parameters.port;
    if (parameters.credentials && parameters.credentials[0] != null && parameters.credentials[0].length !== 0) {
      dsn.username = parameters.credentials[0];
      dsn.password = parameters.credentials[1];
    }
    this.datasource = dsn.toString();
    this.influx = new InfluxDB(this.datasource + this.parameters.database);
    this.influx
      .getDatabaseNames()
      .then(names => {
        if (!names.includes(this.parameters.database)) {
          return this.influx.createDatabase(this.parameters.database).catch(err => {
            throw new Error('WriteInflux - Creating default database at: ' + dsn + ' has encountered the following error: ' + err);
          });
        }
      })
      .catch(err => {
        throw new Error('WriteInflux - Getting database names at: ' + dsn + ' has encountered the following error: ' + err);
      });
  }

  writeArrayToInflux(data: number[], timestamps: number[]) {
    this.influx
      .writePoints(this.setupArray(data, timestamps), {
        database: this.parameters.database,
      })
      .catch(err => {
        throw new Error('WriteInflux - Writing a batch of data to' + this.datasource + ' has encountered the following error: ' + err);
      });
  }

  writePointToInflux(string, point: number, timestamp: number) {
    this.influx
      .writePoints([this.setupPoint(point, timestamp)], {
        database: this.parameters.database,
      })
      .catch(err => {
        throw new Error('WriteInflux - Writing a point of data to' + this.datasource + ' has encountered the following error: ' + err);
      });
  }

  private setupArray(data: number[], timestamps: number[]): IPoint[] {
    let influxPoints: IPoint[] = [];

    for (let i = 0; i < data.length; ++i) {
      influxPoints.push(this.setupPoint(data[i], timestamps[i]));
    }

    return influxPoints;
  }

  private setupPoint(point: number, timestamp: number): IPoint {
    const influxPoint: IPoint = {
      measurement: this.parameters.measurement,
      fields: { [this.parameters.fieldKey]: point },
      timestamp: timestamp,
    };
    return influxPoint;
  }
}
