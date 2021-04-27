// -### MODULES ###-

require("dotenv").config();

const { addAsync } = require("@awaitjs/express");

const session = require("express-session");
const fetch = require("node-fetch");
const express = require("express");
const base64 = require("base-64");
const app = addAsync(express());
const path = require("path");
const url = require("url");
const fs = require("fs");

// -### CONFIG ###-

// Set default prefix for Bungie API
const prefix = "https://www.bungie.net/platform";

app.use(express.json())

// Parse url to get authorization code
function getCode(req) {
    var ru = url.format({
        protocol: req.protocol,
        host: req.get("host"),
        pathname: req.originalUrl,
    });
    return ru.split("code=")[1];
}

// Generate string for state parameter
function initState(length) {
    var result = [];
    var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result.push(
            characters.charAt(Math.floor(Math.random() * charactersLength))
        );
    }
    return result.join("");
}

// Set HTTP server
const port = process.env.PORT || 4645;
app.listen(port, () => {
    console.log(`listening on port ${port}`);
});

// -### MAIN ###-

// Config '/' as index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Config '/auth' endpoint
app.getAsync('/auth', async (req, res) => {

    // Get auth code from URI
    const code = getCode(req);

    // Make config array for method, headers and body
    const config = {
        method: "POST",
        headers: {
            Authorization: `Basic ${base64.encode(
          `35544:${process.env.CLIENT_SECRET}`
        )}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=authorization_code&code=${code}`,
    };

    // Make the request to the Bungie API using the config array
    const bungieRes = await fetch(`${prefix}/app/oauth/token/`, config);

    // Parse responses into a JSON object
    const user = await bungieRes.json();
    user.authCode = code;
    console.log(user);

    res.json(user);

});

// Config '/user' endpoint
// app.getAsync("/user", async (req,res) => {

//     res.sendFile(path.join(__dirname, 'auth.html'));

//     // console.log(req.locals.user)

// })

// Create login endpoint
app.get('/login', async (req, res) => {
    res.redirect(
        "https://www.bungie.net/en/OAuth/Authorize?client_id=35544&response_type=code"
    );
});

// Create logout endpoint
app.get('/logout', async (req, res) => {
    res.redirect("/");
});

// options array for endpoints
// const options = {
//     method: 'GET',
//     headers: {
//       'X-API-KEY': `${process.env.API_KEY}`,
//       'Authorization': `Bearer ${userTokens.access_token}`
//     }
// }

// NOTES:
// Implement state query to URI
// Check for collectible
// Encode & Save user content to localStorage - CURRENT
// Check if token has timed out then:
//          - Send refresh response to server
//          - Refresh tokens on server side
//          - Send new tokens back via (new) post
