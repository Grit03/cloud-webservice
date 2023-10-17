import { createInterface } from "readline/promises";
import { env } from "../config/config.js";

const { ACCESS_KEY, SECRET_KEY } = env;

import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteBucketCommand,
  paginateListObjectsV2,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "ap-northeast-2",
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

// Read the object.
