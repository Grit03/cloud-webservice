const express = require("express");
const connectDB = require("./config/db");
const { PORT } = require("./config/config");

const app = express();

//middleware
app.use(express.json({ extended: false }));

//connect MongoDB
connectDB();

app.get("/api/travel", (req, res) => res.send("API Running"));

//Define routes
app.use("/api/facilities", require("./routes/api/facilities"));
app.use("/api/wcChargers", require("./routes/api/wcChargers"));

app.listen(PORT, () => console.log(`service running on port ${PORT}`));
