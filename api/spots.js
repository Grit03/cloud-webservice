"use strict";

//? Imports & Configs
//* 람다함수들에 필요하는 Import
const MongoClient = require("mongodb").MongoClient;
const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();
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
  console.log("Connected to MongoDB");
  return db;
}

//* AWS SDK 설정
AWS.config.setPromisesDependency(require("bluebird"));

AWS.config.update({
  region: "ap-northeast-2",
});

//` listSpots
module.exports.list = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  //* params 받기
  let temp = JSON.stringify(event.queryStringParameters);
  const eventParams = JSON.parse(temp);

  //* x, y params 가져와서 Number 타입 캐스팅하기
  if (
    eventParams != null &&
    eventParams.hasOwnProperty("x") &&
    eventParams.hasOwnProperty("y")
  ) {
    let { x, y } = eventParams;
    x = Number(x);
    y = Number(y);

    try {
      //* 데이터포털 API 요청 params 준비
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

      //* 데이터포털 API 요청하기
      const apiRes = await axios.get(
        `https://apis.data.go.kr/B551011/KorWithService1/locationBasedList1?${params}`
      );

      let spots = apiRes.data.response.body.items.item;

      //* "inclChargers" params의 값이 "true"이면 실행
      if (eventParams.inclChargers == "true") {
        const db = await connectToDatabase();

        //* MongoDB에서 3km정도 wcChargers 데이터 받기
        const wcChargers = await db
          .collection("wcchargersnew")
          .find({
            lat: { $gt: y - 0.03, $lt: y + 0.03 },
            lon: { $gt: x - 0.03, $lt: x + 0.03 },
          })
          .toArray();

        //* spots array가 map 함수로 "wcChargers" 각 아이템에 넣기
        await Promise.all(
          await spots.map(async (f) => ({
            ...f,
            wcChargers: filterPlacesByRadius(wcChargers, f.mapy, f.mapx, 0.5), //* filterPlacesByRadius 함수로 spots에서 500m 안에 있는 wcChargers만 가져온다
          }))
        ).then((list) => (spots = list));
      }

      //! RATE LIMIT때문에 못함
      // if (eventParams.parkingLot == "true") {
      // await Promise.all(
      //   await spots.map(async (f) => ({
      //     ...f,
      //     parkingLots: await getParkingLots(f.mapy, f.mapx),
      //   }))
      // ).then((list) => (spots = list));
      // }

      //* 데이터 리턴하기
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(spots),
      });
    } catch (err) {
      //* 오류가 발생할 때 오류 메시지 리턴하기
      console.log(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: { message: err.message },
        }),
      });
    }
  } else {
    //* x y 좌표 params에 없을 때 메시지 리턴하기
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
  //* params 받기
  const temp = JSON.stringify(event.queryStringParameters);
  const eventParams = JSON.parse(temp);
  const contentId = eventParams.contentId;

  try {
    //* 데이터포털 API 요청 params 준비
    let payload = {
      MobileOS: "ETC",
      MobileApp: "travelHelper",
      contentId: contentId,
      overviewYN: "Y",
      _type: "json",
      serviceKey: API_KEY,
    };

    const params = new url.URLSearchParams(payload);

    //* 데이터포털 API 요청하기
    const apiRes = await axios.get(
      `https://apis.data.go.kr/B551011/KorWithService1/detailCommon1?${params}`
    );

    const overview = apiRes.data.response.body.items.item[0].overview;

    //* 데이터 리턴하기
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ overview: overview }),
    });
  } catch (err) {
    //* 오류 발생 시 오류 메시지 리턴하기
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
  //* params 받기
  const temp = JSON.stringify(event.queryStringParameters);
  const eventParams = JSON.parse(temp);
  const contentId = eventParams.contentId;
  const contentTypeId = eventParams.contentTypeId;

  try {
    //* 데이터포털 API 요청 params 준비
    let payload = {
      MobileOS: "ETC",
      MobileApp: "travelHelper",
      contentId: contentId,
      contentTypeId: contentTypeId,
      _type: "json",
      serviceKey: API_KEY,
    };

    const params = new url.URLSearchParams(payload);

    //* 데이터포털 API 요청하기
    const apiRes = await axios.get(
      `https://apis.data.go.kr/B551011/KorWithService1/detailIntro1?${params}`
    );

    const detail = apiRes.data.response.body.items.item[0];

    //* 데이터 리턴하기
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ detail: detail }),
    });
  } catch (err) {
    //* 오류 발생 시 오류 메시지 리턴하기
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
  //* params 받기
  const temp = JSON.stringify(event.queryStringParameters);
  const eventParams = JSON.parse(temp);
  const contentId = eventParams.id;
  const contentTypeId = eventParams.type;

  try {
    //* 람다 함수 invoke stringParams 준비
    const payload = {
      queryStringParameters: {
        contentId: contentId,
        contentTypeId: contentTypeId,
      },
    };

    //* spotsOverview 람다 함수 invoke params 준비
    const params1 = {
      FunctionName: "travel-service-dev-spotsOverview",
      InvocationType: "RequestResponse",
      LogType: "None",
      Payload: JSON.stringify(payload),
    };

    //* spotsDetail 람다 함수 invoke params 준비
    const params2 = {
      FunctionName: "travel-service-dev-spotsDetail",
      InvocationType: "RequestResponse",
      LogType: "None",
      Payload: JSON.stringify(payload),
    };

    //* 람다 함수 invoke
    const overviewRes = await lambda.invoke(params1).promise();
    const detailRes = await lambda.invoke(params2).promise();

    //* 데이터 parsing
    let overview = JSON.parse(overviewRes.Payload);
    let detail = JSON.parse(detailRes.Payload);
    overview = JSON.parse(overview.body);
    detail = JSON.parse(detail.body);

    const info = {
      overview: overview.overview,
      ...detail.detail,
    };

    //* 데이터 리턴하기
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(info),
    });
  } catch (err) {
    //* 오류 발생 시 오류 메시지 리턴하기
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
  //* params 받기
  const temp = JSON.stringify(event.queryStringParameters);
  const eventParams = JSON.parse(temp);
  const keyword = eventParams.keyword;
  const encoded = encodeURIComponent(keyword);

  try {
    //* 데이터포털 API 요청 params 준비
    const payload = {
      MobileOS: "ETC",
      MobileApp: "travelHelper",
      _type: "json",
      serviceKey: API_KEY,
    };

    const params = new url.URLSearchParams(payload);

    //* 데이터포털 API 요청
    const apiRes = await axios.get(
      `https://apis.data.go.kr/B551011/KorWithService1/searchKeyword1?keyword=${encoded}&${params}`
    );

    const spots = apiRes.data.response.body.items.item;

    //* 데이터 리턴하기
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ spots: spots }),
    });
  } catch (err) {
    //* 오류 발생 시 오류 메시지 리턴하기
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
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
    const placeLat = place.lat;
    const placeLon = place.lon;
    const distance = haversine(centerLat, centerLon, placeLat, placeLon);
    if (distance <= maxDistance) {
      filteredPlaces.push(place);
    }
  }
  return filteredPlaces;
};

//* parkingLots 람다 함수 invoke하는 함수 (쓰지 않음)
// const getParkingLots = async (y, x) => {
//   const payload = {
//     queryStringParameters: {
//       y: y,
//       x: x,
//     },
//   };

//   const params = {
//     FunctionName: "travel-service-dev-parkingLots",
//     InvocationType: "RequestResponse",
//     LogType: "None",
//     Payload: JSON.stringify(payload),
//   };

//   const parkingLotsRes = await lambda.invoke(params).promise();
//   let parkingLots = JSON.parse(parkingLotsRes.Payload);
//   parkingLots = JSON.parse(parkingLots.body);
//   return parkingLots.parkingLots;
// };
