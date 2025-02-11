import { configDotenv } from "dotenv";
import { cleanEnv, str, num } from "envalid";
configDotenv();

const env = cleanEnv(process.env, {
  PORT: num({ default: 8000 }),
  APP_NAME: str(),
  BASE_URL: str(),
  DB_URI: str(),
  ACCESS_TOKEN_SECRET: str(),
  ACCESS_TOKEN_EXPIRY: str(),
  REFRESH_TOKEN_SECRET: str(),
  REFRESH_TOKEN_EXPIRY: str(),
  FRONTEND_URL: str(),
  ADMIN_EMAIL:str(),
  PASSWORD:str(),
  /*---------------------------------Auth credentials----------------------------*/
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),

});
export default env;
