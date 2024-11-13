import { config } from "dotenv";

config();

const DATABASE_CONFIG = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PSWD,
    port: process.env.POSTGRES_PORT,
};
const TUMBLR_CONFIG = {
    consumer_key: process.env.TUMBLR_CONSUMER_KEY,
    consumer_secret: process.env.TUMBLR_CONSUMER_SECRET,
    token: process.env.TUMBLR_TOKEN,
    token_secret: process.env.TUMBLR_TOKEN_SECRET,
};

export {
    TUMBLR_CONFIG,
    DATABASE_CONFIG
};