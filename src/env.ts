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
    devDefault: '',
    default: '',
    allowEmpty: false,
    desc: 'The alchemy app id',
  }),
  ALCHEMY_AUTH_TOKEN:str({
    devDefault: '',
    default: '',
    allowEmpty: false,
    desc: 'The alchemy notify auth key',
  }),
  ALCHEMY_KEY:str({
    devDefault: '',
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
    default: '',
    allowEmpty: true,
    desc: 'The logtail key to use for logging',
  }),
  API_PARADIGM_SECRET_HEADER: str({
    devDefault: '',
    default: '',
    allowEmpty: true,
    desc: 'The API header to use for the api router',
  }),
});

export default env;