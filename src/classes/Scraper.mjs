import * as cheerio from "cheerio";
import { Utils } from "./index.mjs";

export default class Scraper {
    #_personaName;
    #_profileUrl;
    #_steamId;

    constructor(profileUrl) {
        this.#_profileUrl = this.#_parseProfileUrl(profileUrl);
    }

    getProfileUrl() {
        return this.#_profileUrl;
    }

    async getPersonaName() {
        if (!this.#_personaName) {
            await this.#_setProfileData();
        }

        return this.#_personaName;
    }

    async getSteamId() {
        if (!this.#_steamId) {
            await this.#_setProfileData();
        }

        return this.#_steamId;
    }

    async fetchAvatar() {
        const res = await (await fetch(this.#_profileUrl)).text();
        const $ = cheerio.load(res);
        const avatars = [];

        $("div.playerAvatarAutoSizeInner").find("img").each((_, el) => {
            avatars.push(el.attribs.src);
        });

        return avatars.at(-1);
    }

    async fetchFriends() {
        let profileFriends = this.#_profileUrl;

        if (!Utils.isDevEnv()) {
            const sid = await this.getSteamId();

            profileFriends = new URL("https://steamcommunity.com");
            profileFriends.pathname = `profiles/${sid}/friends`;
        };

        const res = await (await fetch(profileFriends)).text();
        const $ = cheerio.load(res);
        const friends = [];

        $(".selectable").each((_, el) => {
            friends.push(el.attribs['data-steamid']);
        });

        return friends;
    }

    #_parseProfileUrl(profileUrl) {
        if (Utils.isDevEnv()) return new URL(profileUrl);

        const url = new URL("https://steamcommunity.com");
        const regularCharsRegex = /^[a-zA-Z0-9]+$/;
        const steamVanityUrlRegex = /^(?:https?:\/\/)?steamcommunity\.com\/id\/([^\/]+)(?:\/)?$/;
        const steamU64UrlRegex = /^(?:https?:\/\/)?steamcommunity\.com\/profiles\/(\d{17})(?:\/)?$/;
        const steamU64Regex = /^7656\d{13}$/;

        profileUrl = profileUrl.trim();

        const u64Match = profileUrl.match(steamU64UrlRegex);
        if (u64Match || steamU64Regex.test(profileUrl)) {
            url.pathname = `profiles/${u64Match ? u64Match.at(1) : profileUrl}`;
            return url;
        }

        const vanityMatch = profileUrl.match(steamVanityUrlRegex);
        if (vanityMatch) {
            url.pathname = `id/${vanityMatch.at(1)}`;
            return url;
        }

        if (regularCharsRegex.test(profileUrl)) {
            url.pathname = `id/${profileUrl}`;
            return url;
        }

        throw new Error(`'${profileUrl}' is not a valid steam profile.`);
    }

    async #_setProfileData() {
        const blankSpacesRegex = /\s*/g;
        const g_rgProfileDataRegex = /(g_rgProfileData={(.*?)})/gim;
        const htmlTagsRegex = /<(\/*?)(?!(em|p|br\s*\/|strong))\w+?.+?>/gim;
        const htmlContent = await (await fetch(this.#_profileUrl)).text();
        const profileData = JSON.parse(htmlContent.replace(htmlTagsRegex, "")
            .replace(blankSpacesRegex, "")
            .match(g_rgProfileDataRegex).at(0)
            .split("=").at(1)
            .replace(";", "")
        );

        if (!profileData.hasOwnProperty("steamid") || !profileData.hasOwnProperty("personaname")) {
            throw new Error("cannot fetch profile data.");
        }

        this.#_personaName = profileData.personaname;
        this.#_steamId = profileData.steamid;
    }
}