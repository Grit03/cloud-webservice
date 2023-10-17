import express from "express";
import axios from "axios";
import convert from "xml-js";
import xmlParser from "xml2json";
import { env } from "../../config/config.js";

const { API_KEY } = env;
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const apiRes = await axios.get(
      `https://apis.data.go.kr/B551011/KorWithService1/locationBasedList1?MobileOS=WIN&MobileApp=travelHelper&mapX=${x}&mapY=${y}.5393463&radius=5000&serviceKey=${API_KEY}`
    );
    // console.log(apiRes.data);
    var result = JSON.parse(xmlParser.toJson(apiRes.data));
    console.log(result);
    res.json(result);
  } catch (err) {
    const date = new Date(Date.now());
    console.error(`${err} (${date.toLocaleString()})`);
    res.status(500).send("Server Error");
  }
});

router.get("/short", async (req, res) => {});

export { router as facilitiesRouter };
