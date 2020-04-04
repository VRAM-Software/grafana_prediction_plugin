/**
 * File: writeInflux.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-04-04
 * Description: Class to write to influxDB
 */
import { InfluxDB, IPoint } from 'influx';

export class WriteInflux {
  private readonly datasource: string;
  private readonly database: string;
  private readonly influx: InfluxDB;

  constructor(host: string, port: string, database: string, credentials?: [string, string]) {
    this.database = database;

    if (host == null || host.length === 0) {
      throw new Error('WriteInflux - invalid host parameter');
    }
    if (port == null || port.length === 0) {
      throw new Error('WriteInflux - invalid port parameter');
    }
    if (this.database == null || this.database.length === 0) {
      throw new Error('WriteInflux - invalid defaultDB parameter');
    }

    const dsn: URL = new URL(host);
    dsn.port = port;
    if (credentials && credentials[0] != null && credentials[0].length !== 0) {
      dsn.username = credentials[0];
      dsn.password = credentials[1];
    }
    this.datasource = dsn.toString();
    this.influx = new InfluxDB(this.datasource + this.database);
    this.influx
      .getDatabaseNames()
      .then(names => {
        if (!names.includes(this.database)) {
          return this.influx.createDatabase(this.database).catch(err => {
            throw new Error('WriteInflux - Creating default database at: ' + dsn + ' has encountered the following error: ' + err);
          });
        }
      })
      .catch(err => {
        throw new Error('WriteInflux - Getting database names at: ' + dsn + ' has encountered the following error: ' + err);
      });
  }

  writeArrayToInflux(measurement: string, fieldKey: string, data: number[], timestamps: number[]) {
    this.influx
      .writePoints(this.setupArray(measurement, fieldKey, data, timestamps), {
        database: this.database,
      })
      .catch(err => {
        throw new Error('WriteInflux - Writing a batch of data to' + this.datasource + ' has encountered the following error: ' + err);
      });
  }

  writePointToInflux(measurement: string, fieldKey: string, point: number, timestamp: number) {
    this.influx
      .writePoints([this.setupPoint(measurement, fieldKey, point, timestamp)], {
        database: this.database,
      })
      .catch(err => {
        throw new Error('WriteInflux - Writing a point of data to' + this.datasource + ' has encountered the following error: ' + err);
      });
  }

  private setupArray(measurement: string, fieldKey: string, data: number[], timestamps: number[]): IPoint[] {
    let influxPoints: IPoint[] = [];

    for (let i = 0; i < data.length; ++i) {
      influxPoints.push(this.setupPoint(measurement, fieldKey, data[i], timestamps[i]));
    }

    return influxPoints;
  }

  private setupPoint(measurement: string, fieldKey: string, point: number, timestamp: number): IPoint {
    const influxPoint: IPoint = {
      measurement: measurement,
      fields: { fieldKey: point },
      timestamp: timestamp,
    };
    return influxPoint;
  }
}
