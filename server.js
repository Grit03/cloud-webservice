import express from "express";
// const connectDB = require("./config/db");
import { env } from "./config/config.js";
const { PORT } = env;
const app = express();

//middleware
app.use(express.json({ extended: false }));

//connect MongoDB
// connectDB();

app.get("/api/travel", (req, res) => res.send("API Running"));

//Define routes
// app.use("/api/facilities", require("./routes/api/facilities"));
import { wcRouter } from "./routes/api/wcChargers.js";
import { facilitiesRouter } from "./routes/api/facilities.js";

app.use("/api/facilities", facilitiesRouter);
app.use("/api/wcChargers", wcRouter);

app.listen(PORT, () => console.log(`service running on port ${PORT}`));
