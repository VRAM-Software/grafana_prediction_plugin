/**
 * File: config.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-02-19
 * Description: Configuration panel inside Grafana settings
 */

import { PluginMeta } from '@grafana/data';

export class TestControl {
  static templateUrl: string;
  enabled: boolean;
  appEditCtrl: any;
  appModel: any;
  $location: any;

  /** @ngInject */
  constructor($location: any) {
    this.$location = $location;
    this.enabled = false;

    // Codice consigliato da Grafana per gestire abilitazione plugin
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
      console.log('plugin disabled');
      return;
    }

    console.log('Post Update, plugin loaded', this);
  }

  redirect() {}
}

TestControl.templateUrl = 'components/config.html';
