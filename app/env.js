let manifest = null;
switch (process.env.NODE_ENV) {
  case 'development':
    manifest = require('../config/env_development.json');
    break;
  case 'production':
    manifest = require('../config/env_production.json');
    break;
  case 'test':
    manifest = require('../config/env_test.json');
    break;
  default:
    throw new Error('Unknow environment');
}

export default manifest;
