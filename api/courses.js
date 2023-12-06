"use strict";

//? Imports & Configs
//* 람다함수들에 필요하는 Import
const MongoClient = require("mongodb").MongoClient;
const AWS = require("aws-sdk");
const axios = require("axios");
const url = require("url");
const MONGODB_URI = process.env.MONGODB_URI;
const API_KEY = process.env.API_KEY;

//* DB 연결 cache
let cachedDb = null;

//* MongoDB에 연결하는 함수
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

//* AWS SDK 설정
AWS.config.setPromisesDependency(require("bluebird"));

AWS.config.update({
  region: "ap-northeast-2",
});

//` walkingTravel
module.exports.walking = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    //* MongoDB에 연결하기
    const db = await connectToDatabase();

    //* MongoDB에서 walkingTravels 데이터 받기
    const walkingTravels = await db.collection("walkingtrail").find().toArray();

    //* 데이터포털 API 요청 params 준비
    let payload = {
      MobileOS: "ETC",
      MobileApp: "travelHelper",
      _type: "json",
      serviceKey: API_KEY,
      brdDiv: "DNWW",
    };

    const params = new url.URLSearchParams(payload);

    //* 데이터포털 API 요청하기
    const apiRes = await axios.get(
      `https://apis.data.go.kr/B551011/Durunubi/courseList?${params}`
    );

    const data = apiRes.data.response.body.items.item;
    const levelDic = ["초급", "중급", "고급"];

    //* 데이터 preprocessing
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

      //* 코스 거리 전처리
      const distance = crsDstnc + "㎞";

      //* 총 코스 시간 전처리
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

    //* 데이터 리턴하기
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(finalData),
    });
  } catch (err) {
    //* 오류가 발생할 때 오류 메시지 리턴하기
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
    //* 데이터포털 API 요청 params 준비
    let payload = {
      MobileOS: "ETC",
      MobileApp: "travelHelper",
      _type: "json",
      serviceKey: API_KEY,
      brdDiv: "DNBW",
    };

    const params = new url.URLSearchParams(payload);

    //* 데이터포털 API 요청하기
    const apiRes = await axios.get(
      `https://apis.data.go.kr/B551011/Durunubi/courseList?${params}`
    );

    const data = apiRes.data.response.body.items.item;
    const levelDic = ["초급", "중급", "고급"];

    //* 데이터 preprocessing
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

      //* 코스 거리 전처리
      const distance = crsDstnc + "㎞";

      //* 총 코스 시간 전처리
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

    //* 데이터 리턴하기
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(parsedData),
    });
  } catch (err) {
    //* 오류가 발생할 때 오류 메시지 리턴하기
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        message: err.message,
      }),
    });
  }
};
