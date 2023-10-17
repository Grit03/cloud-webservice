import express from "express";
const router = express.Router();
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

const bucketName = "travel-helper";
const key = "전국전동휠체어급속충전기표준데이터.json";

router.get("/", async (req, res) => {
  // Read the object.
  try {
    const { Body } = await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );

    var wcChargers = JSON.parse(await Body.transformToString());
    console.log(req.query);
    if (req.query != null) {
      if (req.query.x != null && req.query.y != null) {
        var { x, y } = req.query;

        y = Number(y);
        x = Number(x);
        const maxDistance = 5; // Maximum distance in kilometers

        // Filter places within the specified radius
        const filtered = filterPlacesByRadius(wcChargers, y, x, maxDistance);

        wcChargers = filtered;
      }
    }

    res.json(wcChargers);
  } catch (err) {
    const date = new Date(Date.now());
    console.error(`${err} (${date.toLocaleString()})`);
    res.status(500).send("Server Error");
  }
});

export { router as wcRouter };
