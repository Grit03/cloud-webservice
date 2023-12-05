"use strict";

//? Imports & Configs
const MongoClient = require("mongodb").MongoClient;
const AWS = require("aws-sdk");

// Define our connection string. Info on where to get this will be described below. In a real world application you'd want to get this string from a key vault like AWS Key Management, but for brevity, we'll hardcode it in our serverless function here.
const MONGODB_URI = process.env.MONGODB_URI;

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = await client.db("travel");

  cachedDb = db;
  console.log("Conntected to MongoDB");
  return db;
}

AWS.config.setPromisesDependency(require("bluebird"));

AWS.config.update({
  region: "ap-northeast-2",
});

//` walkingTravel
module.exports.walking = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const db = await connectToDatabase();

    const walkingTravels = await db.collection("walkingtrail").find().toArray();

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ walkingTravels: walkingTravels }),
    });
  } catch (err) {
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        message: err.message,
      }),
    });
  }
};
