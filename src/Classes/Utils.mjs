import { config } from "dotenv";
import { Readable } from "node:stream";
import { createWriteStream } from "node:fs";

config();

export default class Utils {
    static log(msg, logType = "Log", exit = false) {
        const ANSI_COLOR = {
            red: "\x1b[31m",
            white: "\x1b[37m",
            green: "\x1b[32m",
            yellow: "\x1b[33m",
        };

        let logMsg = (() => {
            const date = new Date();

            return `[${date.toLocaleDateString()} - ${date.toLocaleTimeString()}]`
        })();

        switch (logType) {
            case "Error":
                logMsg += `${ANSI_COLOR.red} [X] ...`;
                break;
            case "Success":
                logMsg += `${ANSI_COLOR.green} [+] ...`;
                break;
            case "Warning":
                logMsg += `${ANSI_COLOR.yellow} [!] ...`;
                break;
            default:
                logMsg += `${ANSI_COLOR.white} [-] ...`;
                break;
        }

        console.log(`${logMsg} ${msg} ${ANSI_COLOR.white}`);

        if (exit) {
            process.exit(logType === "Error" ? 1 : 0);
        }
    }

    static isDevEnv() {
        return process.env.NODE_ENV && process.env.NODE_ENV === "dev";
    }

    static waitSeconds(seconds) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(`we've waited for ${seconds} seconds. yay!`)
            }, seconds * 1000);
        });
    }

    static async downloadImage(saveTo, url) {
        const ws = createWriteStream(saveTo);
        const res = await fetch(url);
        const data = res.body;

        Readable.fromWeb(data).pipe(ws);

        return true;
    }
}