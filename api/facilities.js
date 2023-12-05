"use strict";

const MongoClient = require("mongodb").MongoClient;
const AWS = require("aws-sdk");

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

module.exports.listWcChargers = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  let temp = JSON.stringify(
    event.queryStringParameters ? event.queryStringParameters : event
  );
  const eventParams = JSON.parse(temp);

  try {
    const db = await connectToDatabase();

    let wcChargers = [];
    if (
      eventParams != null &&
      eventParams.hasOwnProperty("x") &&
      eventParams.hasOwnProperty("y")
    ) {
      let { x, y } = eventParams;
      x = Number(x);
      y = Number(y);

      wcChargers = await db
        .collection("wcchargersnew")
        .find({
          lat: { $gt: y - 0.03, $lt: y + 0.03 },
          lon: { $gt: x - 0.03, $lt: x + 0.03 },
        })
        .toArray();
    } else {
      wcChargers = await db
        .collection("wcchargersnew")
        .find({})
        .limit(20)
        .toArray();
    }

    if (wcChargers != []) {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(wcChargers),
      });
    } else {
      callback(null, {
        statusCode: 404,
        body: JSON.stringify({
          message: "Could not find any wheel chair chargers",
        }),
      });
    }
  } catch (err) {
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        message: err.message,
      }),
    });
  }
};
