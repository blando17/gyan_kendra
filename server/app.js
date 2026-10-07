const express = require("express");
const cors = require("cors");
require("dotenv").config();

const mainRouter = require("./routes/main.router");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Behind a hosting proxy, req.ip must come from X-Forwarded-For or every
// caller looks like the proxy and shares one rate-limit bucket.
app.set("trust proxy", 1);

// Notes can be long, so allow a generous JSON body.
app.use(express.json({ limit: "2mb" }));

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: clientUrl.split(",").map((value) => value.trim()),
  }),
);

app.use("/api", mainRouter);

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;
