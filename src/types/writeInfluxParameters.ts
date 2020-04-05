export interface WriteInfluxParameters {
  host: string;
  port: string;
  database: string;
  credentials: [string, string];
  measurement: string;
  fieldKey: string;
}
