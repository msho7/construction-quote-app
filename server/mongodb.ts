import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || "construction_quote_app";

let clientPromise;

export const getMongoClient = () => {
  if (!uri) {
    throw new Error("Missing MONGODB_URI. Copy .env.example to .env.local, then add your MongoDB connection string.");
  }

  if (!clientPromise) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    });

    clientPromise = client.connect();
  }

  return clientPromise;
};

export const getMongoDb = async () => {
  const client = await getMongoClient();
  return client.db(databaseName);
};

export const closeMongoConnection = async () => {
  if (!clientPromise) return;

  const client = await clientPromise;
  await client.close();
  clientPromise = null;
};
