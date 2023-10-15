const mongoose = require("mongoose");

const FacilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  toilet: {
    type: Boolean,
    required: true,
  },
  elevator: {
    type: Boolean,
    required: true,
  },
  carpark: {
    type: Boolean,
    required: true,
  },
  ramp: {
    type: Boolean,
    required: true,
  },
  subway: {
    type: Boolean,
    required: true,
  },
  busStop: {
    type: Boolean,
    required: true,
  },
  wlchrRental: {
    type: Boolean,
    required: true,
  },
  infoDesk: {
    type: Boolean,
    required: true,
  },
  audioGuide: {
    type: Boolean,
    required: true,
  },
  nursingRoom: {
    type: Boolean,
    required: true,
  },
  room: {
    type: Boolean,
    required: true,
  },
  strollerRental: {
    type: Boolean,
    required: true,
  },
});

module.exports = Facility = mongoose.model("facility", FacilitySchema);
