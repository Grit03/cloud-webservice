"use strict";

//? Imports & Configs
const MongoClient = require("mongodb").MongoClient;
const AWS = require("aws-sdk");
const axios = require("axios");
const url = require("url");

// Define our connection string. Info on where to get this will be described below. In a real world application you'd want to get this string from a key vault like AWS Key Management, but for brevity, we'll hardcode it in our serverless function here.
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

//` walkingTravel
module.exports.walking = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const db = await connectToDatabase();

    const walkingTravels = await db.collection("walkingtrail").find().toArray();

    let payload = {
      MobileOS: "ETC",
      MobileApp: "travelHelper",
      _type: "json",
      serviceKey: API_KEY,
      brdDiv: "DNWW",
    };

    const params = new url.URLSearchParams(payload);

    const apiRes = await axios.get(
      `https://apis.data.go.kr/B551011/Durunubi/courseList?${params}`
    );

    const data = apiRes.data.response.body.items.item;
    const levelDic = ["초급", "중급", "고급"];

    const parsedData = data.map((item) => {
      const {
        crsIdx: _id,
        crsKorNm: name,
        sigun: area,
        crsDstnc,
        crsTotlRqrmHour,
        crsLevel,
        crsContents,
        crsSummary,
        crsTourInfo,
        travelerinfo,
      } = item;

      // 코스 거리 전처리
      const distance = crsDstnc + "㎞";

      // 총 코스 시간 전처리
      let total_time =
        parseInt(crsTotlRqrmHour) % 60 === 0
          ? parseInt(crsTotlRqrmHour) / 60
          : (parseFloat(crsTotlRqrmHour) / 60).toFixed(1).toString();
      total_time += "시간";

      const level = levelDic[parseInt(crsLevel) - 1];

      return {
        _id,
        name,
        area,
        distance,
        total_time,
        level,
        image: null,
        detail: {
          crsContents,
          crsSummary,
          crsTourInfo,
          travelerinfo,
        },
      };
    });

    const finalData = walkingTravels.concat(parsedData);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(finalData),
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

//` bikeTravel
module.exports.bikeTravel = async (event, context, callback) => {
  try {
    let payload = {
      MobileOS: "ETC",
      MobileApp: "travelHelper",
      _type: "json",
      serviceKey: API_KEY,
      brdDiv: "DNBW",
    };

    const params = new url.URLSearchParams(payload);

    const apiRes = await axios.get(
      `https://apis.data.go.kr/B551011/Durunubi/courseList?${params}`
    );

    const data = apiRes.data.response.body.items.item;
    const levelDic = ["초급", "중급", "고급"];

    const parsedData = data.map((item) => {
      const {
        crsIdx: _id,
        crsKorNm: name,
        sigun: area,
        crsDstnc,
        crsTotlRqrmHour,
        crsLevel,
        crsContents,
        crsSummary,
        crsTourInfo,
        travelerinfo,
      } = item;

      // 코스 거리 전처리
      const distance = crsDstnc + "㎞";

      // 총 코스 시간 전처리
      let total_time =
        parseInt(crsTotlRqrmHour) % 60 === 0
          ? parseInt(crsTotlRqrmHour) / 60
          : (parseFloat(crsTotlRqrmHour) / 60).toFixed(1).toString();
      total_time += "시간";

      const level = levelDic[parseInt(crsLevel) - 1];

      return {
        _id,
        name,
        area,
        distance,
        total_time,
        level,
        image: null,
        detail: {
          crsContents,
          crsSummary,
          crsTourInfo,
          travelerinfo,
        },
      };
    });

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(parsedData),
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
