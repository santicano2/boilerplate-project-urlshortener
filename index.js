require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns");
const url = require("url");

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

const urlDatabase = [];

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

function validateUrl(inputUrl) {
  try {
    const parsedUrl = new URL(inputUrl);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

function validateDNS(inputUrl) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(inputUrl);
      dns.lookup(parsedUrl.hostname, (err) => {
        if (err) {
          reject(false);
        } else {
          resolve(true);
        }
      });
    } catch {
      reject(false);
    }
  });
}

app.post("/api/shorturl", async function (req, res) {
  const inputUrl = req.body.url;

  if (!validateUrl(inputUrl)) {
    return res.json({ error: "invalid url" });
  }

  try {
    await validateDNS(inputUrl);

    const existingUrlIndex = urlDatabase.findIndex(
      (entry) => entry.original_url === inputUrl
    );

    if (existingUrlIndex !== -1) {
      return res.json({
        original_url: urlDatabase[existingUrlIndex].original_url,
        short_url: urlDatabase[existingUrlIndex].short_url,
      });
    }

    const shortUrl = urlDatabase.length + 1;

    urlDatabase.push({
      original_url: inputUrl,
      short_url: shortUrl,
    });

    res.json({
      original_url: inputUrl,
      short_url: shortUrl,
    });
  } catch {
    res.json({ error: "invalid url" });
  }
});

app.get("/api/shorturl/:shortUrl", function (req, res) {
  const shortUrl = parseInt(req.params.shortUrl);

  const urlEntry = urlDatabase.find((entry) => entry.short_url === shortUrl);

  if (urlEntry) {
    res.redirect(urlEntry.original_url);
  } else {
    res.json({ error: "No URL found" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
