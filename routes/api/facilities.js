import express from "express";
import axios from "axios";
import convert from "xml-js";
import xmlParser from "xml2json";
import { env } from "../../config/config.js";
import url from "url";

const { API_KEY, API_KEY2 } = env;
const router = express.Router();

router.get("/", async (req, res) => {
  if (req.query.x == null || req.query.y == null)
    return res.json({ msg: "Invalid query" });

  const { x, y } = req.query;

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

    const parsedURL = url.parse(apiRes.config.url);
    // console.log(parsedURL);
    // console.log(apiRes.data);
    var result = JSON.parse(xmlParser.toJson(apiRes.data));
    // console.log(apiRes);
    res.json(result.response.body);
  } catch (err) {
    const date = new Date(Date.now());
    console.error(`${err} (${date.toLocaleString()})`);
    res.status(500).send("Server Error");
  }
});

router.get("/short", async (req, res) => {});

export { router as facilitiesRouter };
