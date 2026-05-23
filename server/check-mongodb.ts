import { closeMongoConnection, getMongoDb } from "./mongodb.ts";

try {
  const db = await getMongoDb();
  const result = await db.command({ ping: 1 });
  console.log(`MongoDB connected: ${result.ok === 1 ? "ok" : "unknown"}`);
  console.log(`Database: ${db.databaseName}`);
} catch (error) {
  console.error("MongoDB connection failed.");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await closeMongoConnection();
}
