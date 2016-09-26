import development from '../config/env_development.json';
import production from '../config/env_production.json';
import test from '../config/env_test.json';

let manifest = null;
switch (process.env.NODE_ENV) {
  case 'development':
    manifest = development;
    break;
  case 'production':
    manifest = production;
    break;
  case 'test':
    manifest = test;
    break;
  default:
    throw new Error('Unknow environment');
}

const MANIFEST = manifest;
export default MANIFEST;
