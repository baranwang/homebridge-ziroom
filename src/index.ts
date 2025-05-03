import type { API } from 'homebridge';

import { ZiroomHomebridgePlatform } from './platform';
import { PLATFORM_NAME } from './settings';

export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, ZiroomHomebridgePlatform);
};
