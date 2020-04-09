
import { DataSource } from './datasource';

const url = 'http://localhost:3000';
const database = 'telegraf';
const type = 'type';
const name = 'DataSource';
const username = 'username';
const password = 'password';


const url2 = 'smtp://vram.com:7';
const database2 = 'grafana';
const type2 = 'type';
const name2 = 'name';



let ds, ds2;

beforeEach(() => {
  ds = new DataSource(url, database, username, password, type, name);
  ds2 = new DataSource(url2, database2, '', '', type2, name2);
});

test('copy method works', () => {
  let res = DataSource.copy(ds);
  expect(res).toEqual(ds);
});

test('getHost method', () => {
  let res = ds.getHost();
  expect(res).toEqual('http://localhost');
});

test('getPort method', () => {
  let res = ds.getPort();
  expect(res).toEqual('3000');
});

test('getDatabase method', () => {
  let res = ds.getDatabase();
  expect(res).toEqual(database);
});

test('getUsername method', () => {
  let res = ds.getUsername();
  expect(res).toEqual(username);
});

test('getUsername method', () => {
  let res = ds2.getUsername();
  expect(res).toEqual('');
});

test('getPassword method', () => {
  let res = ds.getPassword();
  expect(res).toEqual(password);
});

test('getPassword method', () => {
  let res = ds2.getPassword();
  expect(res).toEqual('');
});

test('getUrl method', () => {
  let res = ds.getUrl();
  expect(res).toEqual(url);
});

test('getType method', () => {
  let res = ds.getType();
  expect(res).toEqual(type);
});

test('getName method', () => {
  let res = ds.getName();
  expect(res).toEqual(name);
});

test('getGrafanaSourceId method', () => {
  let res = ds.getGrafanaDatasourceId();
  expect(res).toEqual(0);
});

test('clone method', () => {
  let res = ds.clone();
  expect(res).toEqual(expect.any(DataSource));
  expect(res).toEqual(ds);
});

test('cloneWithDB method', () => {
  let res = ds.cloneWithDB('grafana');
  expect(res).toEqual(expect.any(DataSource));
  expect(res).toEqual(new DataSource(url, 'grafana', username, password, type, name));
});

test('cloneWithDB method, exception branch', () => {
  expect(ds.cloneWithDB).toThrowError('invalid databaseName parameter');
});

test('hasSameHost method', () => {
  expect(ds.hasSameHost(ds2)).toBeFalsy();
  expect(ds.hasSameHost(ds)).toBeTruthy();
});

it('throws invalid url parameter', () => {
  expect(() => {
    DataSource('');
  }).toThrowError('invalid url parameter');
});

it('throws invalid type parameter', () => {
  expect(() => {
    DataSource(name);
  }).toThrowError('invalid type parameter');
});

it('throws invalid name parameter', () => {
  expect(() => {
    DataSource(url, database, '', '', type);
  }).toThrowError('invalid name parameter');
});

it('throws invalid datasource parameter', () => {
  expect(DataSource.copy).toThrowError('invalid datasource parameter');
});
