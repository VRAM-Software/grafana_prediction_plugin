/**
 * File: config.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-02-19
 * Description: Configuration panel inside Grafana settings
 */

import { PluginMeta } from '@grafana/data';

export class GrafanaPredictionControl {
  static templateUrl: string;
  enabled: boolean;
  appEditCtrl: any;
  appModel: any;

  /** @ngInject */
  constructor($scope: any, $injector: any) {
    this.enabled = false;

    // Grafana code to handle plugin enable, can't mock appEditCtrl so ignore it
    this.appEditCtrl.setPostUpdateHook(this.postUpdate.bind(this));
    if (!this.appModel) {
      this.appModel = {} as PluginMeta;
    }

    if (!this.appModel.jsonData) {
      this.appModel.jsonData = {};
    }
    console.log(this);
  }

  postUpdate() {
    if (!this.appModel.enabled) {
      this.enabled = false;
      console.log('plugin disabled');
      return;
    }
    this.enabled = true;
    console.log('Post Update, plugin loaded', this);
  }

  redirect() {}
}

GrafanaPredictionControl.templateUrl = 'components/config.html';
