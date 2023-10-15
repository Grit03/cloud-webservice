const express = require("express");
const router = express.Router();
const WcCharger = require("../../models/WcCharger");

router.get("/", async (req, res) => {
  try {
    const wcChargers = await WcCharger.find();
    res.json(wcChargers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// router.post("/test", async (req, res) => {
//   try {
//     var name = "1";
//     var sido = "2";
//     var sigungu = "3";
//     var sigunguNo = "4";
//     var addr1 = "5";
//     var addr2 = "6";
//     var lat = "7";
//     var lon = "8";
//     var location = "9";
//     var startTimeWkday = "10";
//     var endTimeWkday = "11";
//     var startTimeSat = "12";
//     var endTimeSat = "13";
//     var startTimeHol = "14";
//     var endTimeHol = "15";
//     var simulUse = "16";
//     var airPump = "17";
//     var phoneCharger = "18";
//     var agency = "19";
//     var agencyPhoneNo = "20";
//     var refDate = "21";
//     var providerCode = "22";
//     var providerName = "23";

//     const wcCharger = new WcCharger({
//       name,
//       sido,
//       sigungu,
//       sigunguNo,
//       addr1,
//       addr2,
//       lat,
//       lon,
//       location,
//       startTimeWkday,
//       endTimeWkday,
//       startTimeSat,
//       endTimeSat,
//       startTimeHol,
//       endTimeHol,
//       simulUse,
//       airPump,
//       phoneCharger,
//       agency,
//       agencyPhoneNo,
//       refDate,
//       providerCode,
//       providerName,
//     });

//     await wcCharger.save();

//     res.json({ wcCharger });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server Error");
//   }
// });

module.exports = router;
