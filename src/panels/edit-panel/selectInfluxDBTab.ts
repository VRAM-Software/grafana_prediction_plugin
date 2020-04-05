/**
 * File: selectInfluxDBTab.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-04-04
 * Description: Class to handle the selectInflux database tab
 */
import { RxHR } from '@akanass/rx-http-request/browser/index.js';

import { DataSource } from '../../core/datasource';
import { AppEvents } from '@grafana/data';

export class SelectInfluxDBCtrl {
  panel: any;
  panelCtrl: any;

  private datasources: { [datasourceID: string]: DataSource } = {};

  // ANGULARJS <select> stuff - save the selected datasource to write
  // @ts-ignore
  private selectedDatasource: string;

  // @ts-ignore
  constructor($scope, private $sce, datasourceSrv, private backendSrv) {
    this.panelCtrl = $scope.ctrl;
    $scope.ctrl = this;
    this.panel = this.panelCtrl.panel;
    this.panel.datasource = this.panel.datasource || null;
    this.panel.targets = this.panel.targets || [{}];
    this.selectedDatasource = '';
    this.getDatasources();
  }

  // ------------------------------------------------------
  // Get all database structure
  // ------------------------------------------------------

  loadData() {
    (document.getElementById('load-btn') as HTMLButtonElement).disabled = true;
    // If the field is not empty, let's save the selected datasource in the panel
    if (this.panel.predictionSettings.writeDatasourceID.length > 0) {
      this.selectedDatasource = this.panel.predictionSettings.writeDatasourceID;
      this.panelCtrl.publishAppEvent(AppEvents.alertSuccess, ['Saved data loaded succesfully!']);
    } else {
      this.panelCtrl.publishAppEvent(AppEvents.alertSuccess, ['List of available datasources loaded succesfully!']);
    }
  }

  getDatasources() {
    console.log('SelectInfluxDBCtrl - start loading datasources...');
    this.datasources = {};

    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    const hostUrl = protocol + '//' + hostname + ':' + port;

    RxHR.get(hostUrl + '/api/datasources').subscribe(
      data => {
        if (data.response.statusCode === 200) {
          const datasources = JSON.parse(data.body);
          for (const entry of datasources) {
            if (entry.type === 'influxdb') {
              this.datasources[entry.id] = new DataSource(entry.url, entry.database, entry.user, entry.password, entry.type, entry.name, entry.id);
              // this.getDatabases(entry.id);
            } else {
              console.log('SelectInfluxDBCtrl - Ignoring database with name:' + entry.name + ' because is not an InfluxDB');
            }
          }
        }
      },
      err => console.error(err)
    );
  }

  async createDatabaseToWrite() {
    // if user doesn't provide a specific name
    if (this.panel.predictionSettings.influxDatabase === null || this.panel.predictionSettings.influxDatabase.length === 0) {
      this.panel.predictionSettings.influxDatabase = 'GrafanaPredictionDatabase';
      // this.panelCtrl.publishAppEvent(AppEvents.alertError, ['Error with the database name!',
      //   'You must specify a database name where the plug-in should write']);
      throw new Error('SelectInfluxDBCtrl - createDatabaseToWrite - ' + 'You must specify a database name where the plug-in should write!');
    }
    if (typeof this.datasources[this.selectedDatasource] === 'undefined') {
      // no datasource set
      // this.panelCtrl.publishAppEvent(AppEvents.alertError, ['Error with the datasource!',
      //   'You must select a datasource to write data']);
      throw new Error('SelectInfluxDBCtrl - createDatabaseToWrite - ' + 'You must select a datasource to write data!');
    }

    // Save info
    this.panel.predictionSettings.influxHost = this.datasources[this.selectedDatasource].getHost();
    this.panel.predictionSettings.influxPort = this.datasources[this.selectedDatasource].getPort();
    this.panel.predictionSettings.writeDatasourceID = this.selectedDatasource;

    this.panelCtrl.saved_write_connections = true;
    this.panelCtrl.publishAppEvent(AppEvents.alertSuccess, ['InfluxDB parameters saved successfully!']);
  }
}

/** @ngInject */
export function SelectInfluxDBDirective() {
  'use strict';
  return {
    controller: SelectInfluxDBCtrl,
    restrict: 'E',
    scope: true,
    templateUrl: 'public/plugins/grafana-prediction-plugin/panels/edit-panel/partials/selectInfluxDB.html',
  };
}
