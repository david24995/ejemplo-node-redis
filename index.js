const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const PORT = process.env.PORT || 3000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);
const app = express();

function sendResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos</h2>`;
}

async function getRepos(req, res, next) {
  const { username } = req.params;
  const url = `https://api.github.com/users/${username}`;
  const response = await fetch(url);
  const data = await response.json();
  const repos = data.public_repos;
  client.setex(username, 3600, repos);
  console.log("fetching...");
  res.send(sendResponse(username, repos));
}

const cache = (req, res, next) => {
  const { username } = req.params;
  client.get(username, (err, data) => {
    if (err) throw err;
    if (data !== null) {
      res.send(sendResponse(username, data));
    } else {
      next();
    }
  });
};

app.get("/repos/:username", cache, getRepos);

app.listen(PORT, () => {
  console.log("Servidor corriendo en el puerto", PORT);
});
