import express from "express";
import axios from "axios";
import xmlParser from "xml2json";
import { env } from "../../config/config.js";
import url from "url";
import { s3 } from "../../middleware/s3Handler.js";
import {
  PutObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteBucketCommand,
  paginateListObjectsV2,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { filterPlacesByRadius } from "./common.js";

const { API_KEY, API_KEY2 } = env;
const router = express.Router();

const bucketName = "travel-helper";

const getAll = async (x, y) => {
  try {
    let payload = {
      numOfRows: 1000,
      MobileOS: "WIN",
      MobileApp: "travelHelper",
      mapX: x,
      mapY: y,
      radius: 5000,
      serviceKey: API_KEY,
    };

    const params = new url.URLSearchParams(payload);

    const apiRes = await axios.get(
      `https://apis.data.go.kr/B551011/KorWithService1/locationBasedList1?${params}`
    );

    // const parsedURL = url.parse(apiRes.config.url);
    // console.log(parsedURL);
    // console.log(apiRes.data);
    var result = JSON.parse(xmlParser.toJson(apiRes.data));
    return result.response.body.items.item;
  } catch (err) {
    const date = new Date(Date.now());
    console.error(`${err} (${date.toLocaleString()})`);
    return null;
  }
};

router.get("/", async (req, res) => {
  if (req.query.x == null || req.query.y == null)
    return res.json({ msg: "Invalid query" });

  const { x, y } = req.query;

  try {
    const result = await getAll(x, y);
    if (result == null) res.json({ msg: "No places found" });

    res.json(result);
  } catch (err) {
    const date = new Date(Date.now());
    console.error(`${err} (${date.toLocaleString()})`);
    res.status(500).send("Server Error");
  }
});

router.get("/wcCharger", async (req, res) => {
  // Read the object.
  try {
    if (req.query.x == null || req.query.y == null)
      return res.json({ msg: "Invalid query" });

    const { x, y } = req.query;

    const { Body } = await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: "전국전동휠체어급속충전기표준데이터.json",
      })
    );

    let wcChargers = JSON.parse(await Body.transformToString());
    let result = await getAll(x, y);

    if (result == null) res.json({ msg: "No places found" });

    const finishedResult = await result.map((i) => ({
      ...i,
      wcChargers: filterPlacesByRadius(wcChargers, i.mapy, i.mapx, 1),
    }));

    console.log(req.query);
    res.json(finishedResult);
  } catch (err) {
    const date = new Date(Date.now());
    console.error(`${err} (${date.toLocaleString()})`);
    res.status(500).send("Server Error");
  }
});

router.get("/short", async (req, res) => {});

export { router as facilitiesRouter };
