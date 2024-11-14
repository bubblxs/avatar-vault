import { createClient } from "tumblr.js";
import { createReadStream } from "node:fs";

export default class Tumblr {
    #_client;
    #_handle;
    #_blogName;

    constructor(config) {
        this.#_client = createClient(config);
    }

    async init() {
        const userInfo = await this.#_getClient().userInfo();
        const blogName = userInfo.user.blogs[0].name;
        const handle = userInfo.user.name;

        this.#_setBlogName(blogName);
        this.#_setHandle(handle);
    }

    async postImage(img, altText = "") {
        const result = await this.#_getClient().createPost(this.getBlogName(), {
            content: [
                {
                    type: "image",
                    media: createReadStream(img),
                    alt_text: altText,
                }
            ]
        });

        return result.display_text;
    }

    getBlogName() {
        return this.#_blogName;
    }

    getHandle() {
        return this.#_handle;
    }

    #_setBlogName(blogName) {
        this.#_blogName = blogName;
    }

    #_setHandle(handle) {
        this.#_handle = handle;
    }

    #_getClient() {
        if (this.#_client) {
            return this.#_client;
        }

        throw new Error("tumblr.js was not initialized");
    }
}