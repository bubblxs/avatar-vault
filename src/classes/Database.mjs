import pg from "pg";
const { Pool } = pg;

export default class Database {
    #_database;

    constructor(config) {
        this.#_database = new Pool(config);
    }

    async init() {
        const query = `CREATE TABLE IF NOT EXISTS FileExtensions(
            file_ext_id SERIAL PRIMARY KEY,
            file_ext VARCHAR NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS Files(
            file_id SERIAL PRIMARY KEY,
            file_name VARCHAR NOT NULL,
            fk_file_ext_id INT REFERENCES FileExtensions(file_ext_id) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS Users(
            user_id serial PRIMARY KEY,
            steam_id VARCHAR(18) UNIQUE NOT NULL,
            fk_file_id INT REFERENCES Files(file_id) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS Posts(
            post_id serial PRIMARY KEY,
            created_at bigint NOT NULL,
            fk_file_id int REFERENCES Files(file_id),
            fk_user_id int REFERENCES Users(user_id)
        );
        CREATE TABLE IF NOT EXISTS Queue(
            queue_id serial PRIMARY KEY,
            item VARCHAR(18) UNIQUE NOT NULL,
            created_at bigint NOT NULL
        )`;

        await this.#_getDb().query(query);
    }

    async query(query, params = []) {
        const res = await this.#_getDb().query(query, params);

        return res.rows;
    }

    #_getDb() {
        if (this.#_database) {
            return this.#_database;
        }

        throw new Error("database was not initialized.");
    }
}