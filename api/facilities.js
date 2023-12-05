"use strict";

//? Imports & Configs
const MongoClient = require("mongodb").MongoClient;
const AWS = require("aws-sdk");
const axios = require("axios");
const MONGODB_URI = process.env.MONGODB_URI;
const API_KEY2 = process.env.API_KEY2;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

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

//` listWcChargers
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

//` parkingLots
module.exports.parkingLots = async (event, context, callback) => {
  let temp = JSON.stringify(event.queryStringParameters);
  const eventParams = JSON.parse(temp);
  const latitude = eventParams.y;
  const longitude = eventParams.x;

  try {
    const payload = {
      coords: `${longitude},${latitude}`,
    };

    const config = {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
        "X-NCP-APIGW-API-KEY": CLIENT_SECRET,
      },
    };

    const location = await axios.get(
      `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${longitude},${latitude}&output=json`,
      config
    );

    const gu = location.data.results[0].region.area2.name;

    const parkingLotsRes = await axios.get(
      `http://openapi.seoul.go.kr:8088/${API_KEY2}/json/GetParkInfo/1/1000/${gu}`
    );

    let parkingLots = parkingLotsRes.data.GetParkInfo.row;
    console.log(parkingLots);
    parkingLots = filterPlacesByRadius(parkingLots, latitude, longitude, 0.5);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ parkingLots: parkingLots }),
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

//+ External Functions
const haversine = (lat1, lon1, lat2, lon2) => {
  // Radius of the Earth in kilometers
  const earthRadius = 6371;

  // Convert latitude and longitude from degrees to radians
  const [rLat1, rLon1, rLat2, rLon2] = [lat1, lon1, lat2, lon2].map(
    (coord) => (coord * Math.PI) / 180
  );

  // Haversine formula
  const dLat = rLat2 - rLat1;
  const dLon = rLon2 - rLon1;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;

  return distance;
};

const filterPlacesByRadius = (places, centerLat, centerLon, maxDistance) => {
  const filteredPlaces = [];
  for (const place of places) {
    const placeLat = place.LAT;
    const placeLon = place.LNG;
    const distance = haversine(centerLat, centerLon, placeLat, placeLon);
    if (distance <= maxDistance) {
      filteredPlaces.push(place);
    }
  }
  return filteredPlaces;
};
