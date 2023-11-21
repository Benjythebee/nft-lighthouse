import * as dotenv from 'dotenv';
import { envsafe, port, str } from 'envsafe';

dotenv.config();

export const env = envsafe({
  NODE_ENV: str({
    devDefault: 'development',
    allowEmpty: true,
    desc: 'The environment the app is running in',
  }),
  DATABASE_URL: str({
    devDefault: '',
    allowEmpty: false,
    desc: 'The database connection string postgres',
  }),
  ALCHEMY_APP_ID: str({
    devDefault: 'u0oxheectv2ody6j',
    default: '',
    allowEmpty: false,
    desc: 'The alchemy app id',
  }),
  ALCHEMY_AUTH_TOKEN:str({
    devDefault: '',
    default: '',
    allowEmpty: false,
    desc: 'The alchemy api key',
  }),
  AlCHEMY_KEY:str({
    devDefault: 'n3BrZcfmTJGXvG9QNGUFO5K-UDUE6z0l',
    default: '',
    allowEmpty: false,
    desc: 'The alchemy api key',
  }),
  ALCHEMY_HEADER:str({
    devDefault: '',
    default: '',
    allowEmpty: false,
    desc: 'The alchemy auth token header used in x-alchemy-signature',
  }),
  SERVER_HOST: str({
    devDefault: 'localhost',
    desc: 'The host the app is running on',
  }),
  SERVER_PORT: port({
    devDefault: 5500,
    default:8080,
    desc: 'The port the app is running on',
  }),
  LOGTAIL_KEY: str({
    devDefault: '',
    allowEmpty: true,
    desc: 'The logtail key to use for logging',
  }),
});

export default env;