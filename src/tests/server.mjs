import express from "express";

const app = express();

app.set("views", "./src/tests/views");
app.set("view engine", "ejs");

app.use("/assets", express.static(import.meta.dirname + "/assets"));

app.get("/", (req, res) => {
    res.send("we do be gucci, fam.");
});

app.get("/profiles/:id", (req, res) => {
    res.render("profile.ejs", { steamId: req.params.id });
});

app.get("/profiles/:id/friends", (req, res) => {
    let numFriends = parseInt(req.query.frens) ?? 0;
    const steamId = req.params.id;
    const friends = [];

    if (numFriends > 0 && numFriends < 300) {
        const steamU64 = BigInt(76560000000000000n);

        while (numFriends > 0) friends.push(steamU64 + BigInt(Math.round(Math.random() * (numFriends-- * 66_666))));
    }

    res.render("friends", { friends, steamId });
});

app.all("*", (req, res) => res.status(404).send("kinda lost?"));

app.listen(4242, () => console.log("server running at ::4242"));