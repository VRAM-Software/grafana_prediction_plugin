/**
 * File: datasource.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-04-04
 * Description: Representation of a datasource, usually created by making a Grafana HTTP API request and parsing the response.
 */

export class DataSource {
  /**
   * @desc Static copy method.]
   * @param other A DataSource object.
   * @returns A new DataSource object copy of the argument.
   */
  static copy(other: DataSource): DataSource {
    if (other == null) {
      throw new Error('DataSource - invalid datasource parameter');
    }
    return new DataSource(
      `${other.host}:${other.port}`,
      other.database,
      other.username,
      other.password,
      other.type,
      this.name,
      other.grafanaDatasourceId
    );
  }
  /**
   * @field Datasource host address.
   */
  private readonly host: string;
  /**
   * @field Datasource open port.
   */
  private readonly port: string;
  /**
   * @field Default database.
   */
  private readonly database: string;
  /**
   * @field Username (if required).
   */
  private readonly username: string = '';
  /**
   * @field Password (if required).
   */
  private readonly password: string = '';
  /**
   * @field Datasource type (InfluxDB, Prometheus, etc.).
   */
  private readonly type: string = '';
  /**
   * @field Datasource custom name.
   */
  private readonly name: string = '';
  /**
   * @field Unique datasource ID within Grafana.
   */
  private readonly grafanaDatasourceId: number = 0;
  /**
   * @desc Constructor for the DataSource class.
   * @param url URL address of the datasource.
   * @param database Default database.
   * @param username Username for optional log-in.
   * @param password Password for optional log-in.
   * @param type Type of the datasource.
   * @param name Name of the datasource.
   * @param grafanaDatasourceId Unique datasource ID within Grafana.
   */
  constructor(url: string, database = 'telegraf', username = '', password = '', type = '', name = '', grafanaDatasourceId = 0) {
    if (url.length === 0) {
      throw new Error('DataSource - invalid url parameter');
    } else if (type !== null && type.length === 0) {
      throw new Error('DataSource - invalid type parameter');
    } else if (name !== null && name.length === 0) {
      throw new Error('DataSource - invalid name parameter');
    }
    const urlParse: URL = new URL(url);
    this.host = `${urlParse.protocol}//${urlParse.hostname}`;
    this.port = urlParse.port;
    this.database = database;
    if (username === '') {
      this.username = '';
    } else {
      this.username = username;
    }
    if (password === '') {
      this.password = '';
    } else {
      this.password = password;
    }
    this.type = type;
    this.name = name;
    this.grafanaDatasourceId = grafanaDatasourceId;
  }
  /**
   * @returns The object's host field.
   */
  getHost(): string {
    return this.host;
  }
  /**
   * @returns The object's port field.
   */
  getPort(): string {
    return this.port;
  }
  /**
   * @returns The object's database field.
   */
  getDatabase(): string {
    return this.database;
  }
  /**
   * @returns The object's username field.
   */
  getUsername(): string {
    return this.username;
  }
  /**
   * @returns The object's password field.
   */
  getPassword(): string {
    return this.password;
  }
  /**
   * @returns The datasource's URL.
   */
  getUrl(): string {
    return `${this.host}:${this.port}`;
  }
  /**
   * @returns The object's type field.
   */
  getType(): string {
    return this.type;
  }
  /**
   * @returns The object's name field.
   */
  getName(): string {
    return this.name;
  }
  /**
   * @returns The object's grafanaDatasourceId field.
   */
  getGrafanaDatasourceId(): number {
    return this.grafanaDatasourceId;
  }
  /**
   * @desc Creates a new DataSource object identical to this object.
   * @returns A new DataSource object.
   */
  clone(): DataSource {
    return new DataSource(`${this.host}:${this.port}`, this.database, this.username, this.password, this.type, this.name, this.grafanaDatasourceId);
  }
  /**
   * @desc Creates a new DataSource object identical to this object with a custom default database.
   * @param databaseName Custom database.
   * @returns A new DataSource object.
   */
  cloneWithDB(databaseName: string): DataSource {
    if (databaseName == null || databaseName.length === 0) {
      throw new Error('DataSource - invalid databaseName parameter');
    }
    return new DataSource(`${this.host}:${this.port}`, databaseName, this.username, this.password, this.type, this.name, this.grafanaDatasourceId);
  }

  /**
   * @desc Compare two datasources and return true if both of them has the same host (ip+port).
   * @param other The other datasource to compare.
   * @returns True if the datasources has the same host, false otherwise.
   */
  hasSameHost(other: DataSource): boolean {
    return this.host === other.host && this.port === other.port;
  }
}
