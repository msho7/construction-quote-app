import http from "node:http";
import { URL } from "node:url";
import { getMongoDb } from "./mongodb.ts";

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || "127.0.0.1";
const appStateCollectionName = "app_state";
const appStateKeys = [
  "companySettings",
  "contractorExpirySettings",
  "contractorProfile",
  "customerProfile",
  "navigationOpen",
  "priceList",
  "savedContractors",
  "savedCustomers",
  "savedQuotes",
  "savedRoomTemplates",
  "themeMode"
];

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN || "http://localhost:5173",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(payload));
};

const readRequestJson = (request) =>
  new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 10_000_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    request.on("error", reject);
  });

const getMongoStatus = async () => {
  const db = await getMongoDb();
  const ping = await db.command({ ping: 1 });
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();

  return {
    ok: ping.ok === 1,
    databaseName: db.databaseName,
    collections: collections.map((collection) => collection.name).sort(),
    checkedAt: new Date().toISOString()
  };
};

const getAppStateCollection = async () => {
  const db = await getMongoDb();
  return db.collection(appStateCollectionName);
};

const getAppState = async () => {
  const collection = await getAppStateCollection();
  const documents = await collection.find({ _id: { $in: appStateKeys } }).toArray();

  return documents.reduce((state, document) => ({
    ...state,
    [document._id]: document.value
  }), {});
};

const saveAppState = async (state = {}) => {
  const collection = await getAppStateCollection();
  const now = new Date();
  const entries = appStateKeys
    .filter((key) => Object.prototype.hasOwnProperty.call(state, key))
    .map((key) => ({
      updateOne: {
        filter: { _id: key },
        update: {
          $set: {
            value: state[key],
            updatedAt: now
          },
          $setOnInsert: {
            createdAt: now
          }
        },
        upsert: true
      }
    }));

  if (!entries.length) {
    return {
      savedKeys: [],
      updatedAt: now.toISOString()
    };
  }

  await collection.bulkWrite(entries, { ordered: false });

  return {
    savedKeys: entries.map((entry) => entry.updateOne.filter._id),
    updatedAt: now.toISOString()
  };
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      service: "construction-quote-api",
      checkedAt: new Date().toISOString()
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/mongodb/status") {
    try {
      sendJson(response, 200, await getMongoStatus());
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error.message,
        checkedAt: new Date().toISOString()
      });
    }
    return;
  }

  if (url.pathname === "/api/app-state") {
    try {
      if (request.method === "GET") {
        sendJson(response, 200, {
          ok: true,
          state: await getAppState(),
          checkedAt: new Date().toISOString()
        });
        return;
      }

      if (request.method === "PUT") {
        const payload = await readRequestJson(request);
        const result = await saveAppState(payload.state || {});

        sendJson(response, 200, {
          ok: true,
          ...result
        });
        return;
      }
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error.message,
        checkedAt: new Date().toISOString()
      });
      return;
    }
  }

  sendJson(response, 404, {
    ok: false,
    error: "Not found"
  });
});

server.on("error", (error) => {
  console.error(`API server failed to start: ${error.message}`);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`API server listening on http://${host}:${port}`);
});
