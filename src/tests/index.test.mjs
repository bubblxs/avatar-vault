import { it } from "node:test";
import assert from "node:assert";

import { Scraper } from "../classes/index.mjs";

const LOCAL_HOST = new URL("http://localhost:4242");

it("should return an array of 10 steamids", async () => {
    const devProfile = LOCAL_HOST;
    devProfile.pathname = "profiles/666/friends";
    devProfile.searchParams.append("frens", 10);

    const scrpr = new Scraper(devProfile);
    const frens = await scrpr.fetchFriends();

    assert.strictEqual(frens.length, 10);
});

it("should return one avatar", async () => {
    const devProfile = LOCAL_HOST;
    devProfile.pathname = "profiles/666";

    const scrpr = new Scraper(devProfile);
    const avatar = await scrpr.fetchAvatar();

    assert.strictEqual(avatar, "/assets/profile_full.jpg");
});

it("should return the profile's steamid", async () => {
    const devProfile = LOCAL_HOST;
    devProfile.pathname = "profiles/666";

    const scrpr = new Scraper(devProfile);
    const steamId = await scrpr.getSteamId();

    assert.strictEqual(steamId, "76560000000000000");
});

it("should return the profile's personaname", async () => {
    const devProfile = LOCAL_HOST;
    devProfile.pathname = "profiles/666";

    const scrpr = new Scraper(devProfile);
    const personaName = await scrpr.getPersonaName();

    assert.strictEqual(personaName, "GabeLoganNewell");
});