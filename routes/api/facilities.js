const express = require("express");
const router = express.Router();
const Facility = require("../../models/Facility");

router.get("/", async (req, res) => {
  try {
    const facilities = await Facility.find();
    console.log(facilities);
    res.json(facilities);
  } catch (err) {
    const date = new Date(Date.now());
    console.error(`${err} (${date.toLocaleString()})`);
    res.status(500).send("Server Error");
  }
});

router.get("/short", async (req, res) => {
  try {
    const facilities = await Facility.findOne();
    console.log(facilities);
    res.json(facilities);
  } catch (err) {
    const date = new Date(Date.now());
    console.error(`${err} (${date.toLocaleString()})`);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
