const dns = require("dns");
const mongoose = require("mongoose");

// Atlas connection strings use an SRV record, and some networks (college
// wifi, certain routers) refuse that lookup -- the symptom is
// "querySrv ECONNREFUSED". Pointing Node at a public resolver avoids it.
// Set DNS_SERVERS=system in .env to use the machine's own resolver instead.
if (process.env.DNS_SERVERS !== "system") {
  const servers = (process.env.DNS_SERVERS || "8.8.8.8,8.8.4.4")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  try {
    dns.setServers(servers);
  } catch (err) {
    console.warn("Could not set DNS servers, using the system resolver.");
  }
}

// Single Mongoose connection for the whole server.
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy server/.env.example to server/.env and paste your connection string.",
    );
  }

  mongoose.set("strictQuery", true);

  // These failures are usually transient, so give it a couple of tries
  // before falling over.
  const attempts = 3;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

      console.log(`Connected to MongoDB (${mongoose.connection.name})`);

      return mongoose.connection;
    } catch (err) {
      if (attempt === attempts) throw err;

      console.warn(
        `MongoDB connection attempt ${attempt} failed (${err.message}). Retrying...`,
      );

      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }

  return mongoose.connection;
}

module.exports = { connectDB };
