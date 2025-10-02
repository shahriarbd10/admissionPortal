import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI missing in environment");
}

// Recommended by Mongoose to avoid deprecation warnings
mongoose.set("strictQuery", true);

type GlobalWithMongoose = typeof globalThis & {
  _mongooseConn?: Promise<typeof mongoose>;
};

let cached = (global as GlobalWithMongoose)._mongooseConn;

async function connect() {
  // If already cached promise, reuse it
  if (cached) return cached;

  cached = mongoose
    .connect(MONGODB_URI!, {
      // If your URI has no dbName, this ensures 'admission' is used

      dbName: "admission",
      // useNewUrlParser/useUnifiedTopology not required on modern driver
      serverSelectionTimeoutMS: 15000, // fail fast if cannot connect
    })
    .then((m) => {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("[MongoDB] connected:", m.connection.host);
      }
      return m;
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("[MongoDB] connection error:", err?.message || err);
      throw err;
    });

  (global as GlobalWithMongoose)._mongooseConn = cached;
  return cached;
}

export async function dbConnect() {
  return connect();
}
