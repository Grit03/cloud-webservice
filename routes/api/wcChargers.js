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

const bucketName = "travel-helper";
const key = "전국전동휠체어급속충전기표준데이터.json";

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

        wcChargers = wcChargers.filter(function (i) {
          return i.lat <= y + 100 && i.lon >= x;
        });

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
