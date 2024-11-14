import assert from "node:assert";
import { randomBytes } from "node:crypto";
import { resolve, join } from "node:path";
import { scheduleJob } from "node-schedule";
import { mkdirSync, existsSync } from "node:fs";

import { DATABASE_CONFIG, TUMBLR_CONFIG } from "../config.mjs";
import { Tumblr, Scraper, Database, Utils } from "./Classes/index.mjs";

const IMG_DIR = resolve(import.meta.dirname, "imgs");
const MIN_ITEMS_QUEUE = 10;
const MAX_ITEMS_QUEUE = 100;

const queue = [];
const tumblr = new Tumblr(TUMBLR_CONFIG);
const database = new Database(DATABASE_CONFIG);

const run = async () => {
    assert(queue.length > 0, "empty queue.");

    const profileU64 = queue.at(0);

    try {
        const { avatarUrl, steamId, friends } = await crawl(profileU64);
        const { filename, fileExt } = ((url) => {
            return {
                filename: randomBytes(8).toString("hex"),
                fileExt: url.split(".").at(-1).replace("/", "")
            };
        })(avatarUrl);
        const imagePath = join(IMG_DIR, `${filename}.${fileExt}`);
        const wasDownloaded = await Utils.downloadImage(imagePath, avatarUrl);

        if (!wasDownloaded) {
            throw new Error(`${steamId}'s profile picture cannot be downloaded.`);
        }

        await database.query(`INSERT INTO FileExtensions (file_ext) VALUES ($1) ON CONFLICT DO NOTHING;`,
            [fileExt]
        );

        await database.query(`INSERT INTO Files (file_name, fk_file_ext_id) 
        VALUES ($1, (SELECT FILE_EXT_ID FROM FileExtensions WHERE FILE_EXT = $2 LIMIT 1));`,
            [filename, fileExt]
        );

        await database.query(`INSERT INTO Users (steam_id, fk_file_id) 
        VALUES ($1, (SELECT file_id FROM Files WHERE FILE_NAME = $2 LIMIT 1)) ON CONFLICT DO NOTHING;`,
            [steamId, filename]
        );

        const postDisplayText = await tumblr.postImage(imagePath, `${steamId}'s profile.`);

        await database.query(`INSERT INTO Posts (created_at, fk_file_id, fk_user_id) 
        VALUES ($1, (SELECT FILE_ID FROM Files WHERE FILE_NAME = $2 LIMIT 1), 
        (SELECT USER_ID FROM Users WHERE STEAM_ID = $3 LIMIT 1));`,
            [Date.now(), filename, steamId]
        );

        await database.query("DELETE FROM Queue WHERE Item = $1;", [steamId]);

        Utils.log(`${filename}.${fileExt} ${postDisplayText}.`, "Success");

        if (friends.length > 0) {
            let count = 0;

            for (const fren of friends) {
                try {
                    await database.query("INSERT INTO Queue (item, created_at) VALUES ($1, $2);", [fren, Date.now()]);
                    count++;

                } catch (error) { }
            }

            Utils.log(`${count} items added to queue on database.`, "Warning");
        }

    } catch (error) {
        Utils.log(`error on run(): ${error}.`, "Error");

    } finally {
        const idx = queue.indexOf(profileU64);

        if (idx !== -1) queue.splice(idx, 1);

        if (queue.length < MIN_ITEMS_QUEUE) {
            (await database.query("SELECT ITEM FROM QUEUE LIMIT $1;", [MAX_ITEMS_QUEUE - queue.length])).forEach((row) => {
                queue.push(row.item);
            });
        }

        Utils.log(`${queue.length} items on queue.`);
    }
};

const crawl = async (profile) => {
    try {
        const scraper = new Scraper(profile);
        const steamId = await scraper.getSteamId();
        const friends = await scraper.fetchFriends();
        const avatarUrl = await scraper.fetchAvatar();

        return {
            avatarUrl,
            friends,
            steamId
        }
    } catch (error) {
        Utils.log(`error on crawl(): ${error}.`, "Error");
    }
};

const init = async () => {
    const entrySteamIds = process.argv.slice(2);

    await database.init();
    await tumblr.init();

    if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR);

    (await database.query("SELECT ITEM FROM QUEUE LIMIT $1;", [MAX_ITEMS_QUEUE - entrySteamIds.length])).forEach((row) => {
        queue.push(row.item);
    });

    queue.push(...entrySteamIds);

    assert(queue.length > 0, "we got an empty queue during initialization.");

    if (!Utils.isDevEnv()) {
        /* 30 min */
        scheduleJob("*/30 * * * *", async () => {
            await run();
        });

        Utils.log("this application is scheduled to run every 30 minutes.", "Warning");
    }

    Utils.log(`${queue.length} items on queue.`);
};

(async () => {
    await init();
    await run();
})();