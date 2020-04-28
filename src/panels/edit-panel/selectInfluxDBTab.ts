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
  $scope: any;
  panel: any;
  panelCtrl: any;

  private datasources: { [datasourceID: string]: DataSource } = {};

  /** @ngInject */
  constructor($scope) {
    this.$scope = $scope;
    this.panelCtrl = $scope.ctrl;
    $scope.ctrl = this;
    this.panel = this.panelCtrl.panel;
    this.panel.datasource = this.panel.datasource || null;
    this.panel.targets = this.panel.targets || [{}];
    this.getDatasources();
  }

  // ------------------------------------------------------
  // Get all database structure
  // ------------------------------------------------------
  getDatasources() {
    console.log('SelectInfluxDBCtrl - start loading datasources...');
    this.datasources = {};

    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    const hostUrl = `${protocol}//${hostname}:${port}`;

    RxHR.get(`${hostUrl}/api/datasources`).subscribe(
      data => {
        if (data.response.statusCode === 200) {
          const datasources = JSON.parse(data.body);
          for (const entry of datasources) {
            if (entry.type === 'influxdb') {
              this.datasources[entry.id] = new DataSource(entry.url, entry.database, entry.user, entry.password, entry.type, entry.name, entry.id);
            } else {
              console.log(`SelectInfluxDBCtrl - Ignoring database with name:${entry.name} because is not an InfluxDB`);
            }
          }
          this.panelCtrl.refresh();
          this.$scope.$digest();
          console.log('refresh after datasources load');
        }
      },
      err => console.error(err)
    );
  }

  async updateDatabaseParams() {
    // if user doesn't provide a specific name
    if (this.panel.predictionSettings.influxDatabase === null || this.panel.predictionSettings.influxDatabase.length === 0) {
      this.panel.predictionSettings.influxDatabase = 'GrafanaPredictionDatabase';
      this.panelCtrl.publishAppEvent(AppEvents.alertError, [
        'Error with the database name!',
        'You must specify a database name where the plug-in should write',
      ]);
      return;
    }
    if (typeof this.datasources[this.panel.predictionSettings.writeDatasourceID] === 'undefined') {
      // no datasource set
      this.panelCtrl.publishAppEvent(AppEvents.alertError, ['Error with the datasource!', 'You must select a datasource to write data']);
      return;
    }
    if (this.panel.predictionSettings.influxMeasurement === null || this.panel.predictionSettings.influxMeasurement.length === 0) {
      this.panelCtrl.publishAppEvent(AppEvents.alertError, [
        'Error with the measurement name!',
        'You must specify a measurement name where the plug-in should write',
      ]);
      return;
    }
    if (this.panel.predictionSettings.influxFieldKey === null || this.panel.predictionSettings.influxFieldKey.length === 0) {
      this.panelCtrl.publishAppEvent(AppEvents.alertError, [
        'Error with the fieldKey name!',
        'You must specify a fieldKey name where the plug-in should write',
      ]);
      return;
    }

    // Save info
    this.panel.predictionSettings.influxHost = this.datasources[this.panel.predictionSettings.writeDatasourceID].getHost();
    this.panel.predictionSettings.influxPort = this.datasources[this.panel.predictionSettings.writeDatasourceID].getPort();

    this.panel.predictionSettings.savedWriteConnections = true;
    await this.panelCtrl.confirmDatabaseSettings();
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
