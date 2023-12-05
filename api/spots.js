"use strict";

//? Imports & Configs
const MongoClient = require("mongodb").MongoClient;
const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();
const axios = require("axios");
const url = require("url");
const MONGODB_URI = process.env.MONGODB_URI;
const API_KEY = process.env.API_KEY;

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

//` listSpots
module.exports.list = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let temp = JSON.stringify(event.queryStringParameters);
  const eventParams = JSON.parse(temp);

  if (
    eventParams != null &&
    eventParams.hasOwnProperty("x") &&
    eventParams.hasOwnProperty("y")
  ) {
    let { x, y } = eventParams;
    x = Number(x);
    y = Number(y);

    try {
      let payload = {
        numOfRows: 1000,
        MobileOS: "ETC",
        MobileApp: "travelHelper",
        mapX: x,
        mapY: y,
        radius: 3000,
        _type: "json",
        serviceKey: API_KEY,
      };

      const params = new url.URLSearchParams(payload);

      const apiRes = await axios.get(
        `https://apis.data.go.kr/B551011/KorWithService1/locationBasedList1?${params}`
      );

      let spots = apiRes.data.response.body.items.item;

      if (eventParams.inclChargers == "true") {
        const db = await connectToDatabase();

        const wcChargers = await db
          .collection("wcchargersnew")
          .find({
            lat: { $gt: y - 0.03, $lt: y + 0.03 },
            lon: { $gt: x - 0.03, $lt: x + 0.03 },
          })
          .toArray();

        await Promise.all(
          await spots.map(async (f) => ({
            ...f,
            wcChargers: filterPlacesByRadius(wcChargers, f.mapy, f.mapx, 0.5),
          }))
        ).then((list) => (spots = list));
      }

      callback(null, {
        statusCode: 200,
        body: JSON.stringify(spots),
      });
    } catch (err) {
      console.log(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Error`,
        }),
      });
    }
  } else {
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        message: "No Coordinates provided",
      }),
    });
  }
};

//` spotsOverview
module.exports.overview = async (event, context, callback) => {
  const temp = JSON.stringify(event.queryStringParameters);
  const eventParams = JSON.parse(temp);
  const contentId = eventParams.contentId;

  try {
    let payload = {
      MobileOS: "ETC",
      MobileApp: "travelHelper",
      contentId: contentId,
      overviewYN: "Y",
      _type: "json",
      serviceKey: API_KEY,
    };

    const params = new url.URLSearchParams(payload);

    const apiRes = await axios.get(
      `https://apis.data.go.kr/B551011/KorWithService1/detailCommon1?${params}`
    );

    const overview = apiRes.data.response.body.items.item[0].overview;

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ overview: overview }),
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

//` spotsDetail
module.exports.detail = async (event, context, callback) => {
  const temp = JSON.stringify(event.queryStringParameters);
  const eventParams = JSON.parse(temp);
  const contentId = eventParams.contentId;
  const contentTypeId = eventParams.contentTypeId;

  try {
    let payload = {
      MobileOS: "ETC",
      MobileApp: "travelHelper",
      contentId: contentId,
      contentTypeId: contentTypeId,
      _type: "json",
      serviceKey: API_KEY,
    };

    const params = new url.URLSearchParams(payload);

    const apiRes = await axios.get(
      `https://apis.data.go.kr/B551011/KorWithService1/detailIntro1?${params}`
    );

    const detail = apiRes.data.response.body.items.item[0];

    console.log(detail);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ detail: detail }),
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

//` spotsInfo
module.exports.info = async (event, context, callback) => {
  const temp = JSON.stringify(event.queryStringParameters);
  const eventParams = JSON.parse(temp);
  const contentId = eventParams.id;
  const contentTypeId = eventParams.type;

  try {
    const payload = {
      queryStringParameters: {
        contentId: contentId,
        contentTypeId: contentTypeId,
      },
    };

    const params1 = {
      FunctionName: "travel-service-dev-spotsOverview",
      InvocationType: "RequestResponse",
      LogType: "None",
      Payload: JSON.stringify(payload),
    };

    const params2 = {
      FunctionName: "travel-service-dev-spotsDetail",
      InvocationType: "RequestResponse",
      LogType: "None",
      Payload: JSON.stringify(payload),
    };

    const overviewRes = await lambda.invoke(params1).promise();
    const detailRes = await lambda.invoke(params2).promise();
    let overview = JSON.parse(overviewRes.Payload);
    let detail = JSON.parse(detailRes.Payload);
    overview = JSON.parse(overview.body);
    detail = JSON.parse(detail.body);

    const info = {
      overview: overview.overview,
      ...detail.detail,
    };

    console.log(info);
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(info),
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

//` spotSearch
module.exports.search = async (event, context, callback) => {
  const temp = JSON.stringify(event.queryStringParameters);
  const eventParams = JSON.parse(temp);
  const keyword = eventParams.keyword;
  const encoded = encodeURIComponent(keyword);

  try {
    const payload = {
      MobileOS: "ETC",
      MobileApp: "travelHelper",
      _type: "json",
      serviceKey: API_KEY,
    };

    const params = new url.URLSearchParams(payload);

    const apiRes = await axios.get(
      `https://apis.data.go.kr/B551011/KorWithService1/searchKeyword1?keyword=${encoded}&${params}`
    );

    const spots = apiRes.data.response.body.items.item;

    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ spots: spots }),
    });
  } catch (err) {
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
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
    const placeLat = place.lat;
    const placeLon = place.lon;
    const distance = haversine(centerLat, centerLon, placeLat, placeLon);
    if (distance <= maxDistance) {
      filteredPlaces.push(place);
    }
  }
  return filteredPlaces;
};
