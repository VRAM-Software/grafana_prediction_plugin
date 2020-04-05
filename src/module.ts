/* istanbul ignore file */
/**
 * File: module.ts
 * Author: Marco Dalla Libera
 * Creation date: 2020-02-19
 * Description: Main module file of the app plugin, that imports other resources
 */

import { GrafanaPredictionControl } from './components/config';
import { AppPlugin } from '@grafana/data';

export { GrafanaPredictionControl as ConfigCtrl };

export const plugin = new AppPlugin();
