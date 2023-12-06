"use strict";

//? Imports & Configs
//* 람다함수들에 필요하는 Import
const MongoClient = require("mongodb").MongoClient;
const AWS = require("aws-sdk");
const axios = require("axios");
const MONGODB_URI = process.env.MONGODB_URI;
const API_KEY2 = process.env.API_KEY2;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

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

//` listWcChargers
module.exports.listWcChargers = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  //* params 받기
  let temp = JSON.stringify(
    event.queryStringParameters ? event.queryStringParameters : event
  );
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
      //* MongoDB에 연결하기
      const db = await connectToDatabase();

      let wcChargers = [];

      //* x, y params 가져와서 Number 타입 캐스팅하기

      //* MongoDB에서 3km정도 wcChargers 데이터 받기
      wcChargers = await db
        .collection("wcchargersnew")
        .find({
          lat: { $gt: y - 0.03, $lt: y + 0.03 },
          lon: { $gt: x - 0.03, $lt: x + 0.03 },
        })
        .toArray();

      if (wcChargers != []) {
        //* 데이터 리턴하기
        callback(null, {
          statusCode: 200,
          body: JSON.stringify(wcChargers),
        });
      } else {
        //* 빈 array 받으면 리턴하는 메시지
        callback(null, {
          statusCode: 404,
          body: JSON.stringify({
            message: "Could not find any wheel chair chargers",
          }),
        });
      }
    } catch (err) {
      //* 오류가 발생할 때 오류 메시지 리턴하기
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: err.message,
        }),
      });
    }
  } else {
    //* x y 좌표 params에 없을 때 메시지 리턴하기
    callback(null, {
      statusCode: 404,
      body: JSON.stringify({
        message: "Could not find any wheel chair chargers",
      }),
    });
  }
};

//` parkingLots
module.exports.parkingLots = async (event, context, callback) => {
  //* params 받기
  let temp = JSON.stringify(event.queryStringParameters);
  const eventParams = JSON.parse(temp);
  const latitude = eventParams.y;
  const longitude = eventParams.x;

  try {
    //* Naver Reverse Geocoding API 준비 (params + headers)
    const payload = {
      coords: `${longitude},${latitude}`,
    };

    const config = {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
        "X-NCP-APIGW-API-KEY": CLIENT_SECRET,
      },
    };

    //* Naver Reverse Geocoding API 요청 (x, y로 주소 받아서 구 찾기)
    const location = await axios.get(
      `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${longitude},${latitude}&output=json`,
      config
    );

    const gu = location.data.results[0].region.area2.name;

    //* Open API 요청 (구에 있는 주차장 데이터 받ㄱㅣ)
    const parkingLotsRes = await axios.get(
      `http://openapi.seoul.go.kr:8088/${API_KEY2}/json/GetParkInfo/1/1000/${gu}`
    );

    let parkingLots = parkingLotsRes.data.GetParkInfo.row;

    //* filterPlacesByRadius 함수로 array에서 500m 안에 있는 parkingLot만 가져온다
    parkingLots = filterPlacesByRadius(parkingLots, latitude, longitude, 0.5);

    //* 데이터 preprocessing
    const parsedData = parkingLots.map((item) => {
      const {
        PARKING_NAME,
        PARKING_CODE,
        PARKING_TYPE_NM,
        OPERATION_RULE_NM,
        TEL,
        PAY_YN,
        PAY_NM,
        NIGHT_FREE_OPEN,
        NIGHT_FREE_OPEN_NM,
        WEEKDAY_BEGIN_TIME,
        WEEKDAY_END_TIME,
        WEEKEND_BEGIN_TIME,
        WEEKEND_END_TIME,
        HOLIDAY_BEGIN_TIME,
        HOLIDAY_END_TIME,
        RATES,
        TIME_RATE,
        ADD_RATES,
        ADD_TIME_RATE,
        LAT,
        LNG,
      } = item;

      return {
        PARKING_NAME,
        PARKING_CODE,
        PARKING_TYPE_NM,
        OPERATION_RULE_NM,
        TEL,
        PAY_YN,
        PAY_NM,
        NIGHT_FREE_OPEN,
        NIGHT_FREE_OPEN_NM,
        WEEKDAY_BEGIN_TIME,
        WEEKDAY_END_TIME,
        WEEKEND_BEGIN_TIME,
        WEEKEND_END_TIME,
        HOLIDAY_BEGIN_TIME,
        HOLIDAY_END_TIME,
        RATES,
        TIME_RATE,
        ADD_RATES,
        ADD_TIME_RATE,
        LAT,
        LNG,
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

//+ External Functions
//* haversine formula 함수

const haversine = (lat1, lon1, lat2, lon2) => {
  //* 지구의 반지름 (kilometer로)
  const earthRadius = 6371;

  //* 위도 및 경도를 도에서 라디안으로 변환
  const [rLat1, rLon1, rLat2, rLon2] = [lat1, lon1, lat2, lon2].map(
    (coord) => (coord * Math.PI) / 180
  );

  //* Haversine formula
  const dLat = rLat2 - rLat1;
  const dLon = rLon2 - rLon1;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = earthRadius * c;

  return distance;
};

//* Array를 받아 haversine 함수를 통해 거리에 따라 필터링 하는 함수
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
