const mongoose = require("mongoose");

const WcChargerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sido: {
    type: String,
    required: true,
  },
  sigungu: {
    type: String,
    required: true,
  },
  sigunguNo: {
    type: Number,
    required: true,
  },
  addr1: {
    type: String,
    required: false,
  },
  addr2: {
    type: String,
    required: false,
  },
  lat: {
    type: Number,
    required: true,
  },
  lon: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  startTimeWkday: {
    type: String,
    required: true,
  },
  endTimeWkday: {
    type: String,
    required: true,
  },
  startTimeSat: {
    type: String,
    required: true,
  },
  endTimeSat: {
    type: String,
    required: true,
  },
  startTimeHol: {
    type: String,
    required: true,
  },
  endTimeHol: {
    type: String,
    required: true,
  },
  simulUse: {
    type: Number,
    required: true,
  },
  airPump: {
    type: Boolean,
    required: true,
  },
  phoneCharger: {
    type: Boolean,
    required: true,
  },
  agency: {
    type: String,
    required: true,
  },
  agencyPhoneNo: {
    type: String,
    required: true,
  },
  refDate: {
    type: Date,
    required: true,
  },
  providerCode: {
    type: Number,
    required: true,
  },
  providerName: {
    type: String,
    required: true,
  },
});

module.exports = WcCharger = mongoose.model("wcCharger", WcChargerSchema);
