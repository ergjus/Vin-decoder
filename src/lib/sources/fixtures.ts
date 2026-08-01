// Demo data served when USE_FIXTURES=1 — mirrors each API's real response
// shape so the whole UI can be exercised offline. All data describes a
// 2013 Ford F-150 XLT SuperCrew regardless of the VIN entered.

const vpicDecode = {
  Count: 1,
  Message: "Results returned successfully",
  SearchCriteria: "VIN:1FTFW1ET9DFC10312",
  Results: [
    {
      Make: "FORD",
      Model: "F-150",
      ModelYear: "2013",
      Trim: "XLT",
      Series: "F-Series",
      BodyClass: "Pickup",
      VehicleType: "TRUCK",
      Doors: "4",
      DriveType: "4WD/4-Wheel Drive/4x4",
      GVWR: "Class 2E: 6,001 - 7,000 lb (2,722 - 3,175 kg)",
      EngineCylinders: "6",
      DisplacementL: "3.5",
      EngineConfiguration: "V-Shaped",
      EngineHP: "365",
      FuelTypePrimary: "Gasoline",
      FuelInjectionType: "Sequential Fuel Injection (SFI)",
      Turbo: "Yes",
      OtherEngineInfo: "EcoBoost twin-turbo",
      TransmissionStyle: "Automatic",
      TransmissionSpeeds: "6",
      Manufacturer: "FORD MOTOR COMPANY, USA",
      PlantCompanyName: "Dearborn Truck Plant",
      PlantCity: "DEARBORN",
      PlantState: "MICHIGAN",
      PlantCountry: "UNITED STATES (USA)",
      ABS: "Standard",
      ESC: "Standard",
      TractionControl: "Standard",
      TPMS: "Direct",
      AirBagLocFront: "1st Row (Driver and Passenger)",
      AirBagLocSide: "1st Row (Driver and Passenger)",
      AirBagLocCurtain: "1st and 2nd Rows",
      SeatBeltsAll: "Manual",
      RearVisibilitySystem: "Optional",
      ErrorCode: "0",
      ErrorText: "0 - VIN decoded clean. Check Digit (9th position) is correct",
    },
  ],
};

const recalls = {
  Count: 2,
  Message: "Results returned successfully",
  results: [
    {
      Manufacturer: "Ford Motor Company",
      NHTSACampaignNumber: "16V345000",
      ReportReceivedDate: "25/05/2016",
      Component: "SERVICE BRAKES, HYDRAULIC",
      Summary:
        "Ford Motor Company (Ford) is recalling certain model year 2013-2014 F-150 vehicles manufactured August 1, 2013, to August 31, 2014. The brake master cylinder may leak brake fluid into the brake booster, reducing braking performance.",
      Consequence:
        "A loss of brake fluid can reduce the front brakes' effectiveness, lengthening the distance needed to stop the vehicle and increasing the risk of a crash.",
      Remedy:
        "Ford will notify owners, and dealers will replace the brake master cylinder, free of charge.",
    },
    {
      Manufacturer: "Ford Motor Company",
      NHTSACampaignNumber: "14V387000",
      ReportReceivedDate: "02/07/2014",
      Component: "POWER TRAIN: AUTOMATIC TRANSMISSION",
      Summary:
        "Ford is recalling certain model year 2011-2013 F-150 vehicles. The transmission may unexpectedly downshift to first gear due to an intermittent output speed sensor failure.",
      Consequence:
        "An unexpected downshift to first gear at speed could cause a loss of vehicle control, increasing the risk of a crash.",
      Remedy:
        "Dealers will update the powertrain control module software, free of charge.",
    },
  ],
};

const complaints = {
  count: 2,
  results: [
    {
      odiNumber: 11512345,
      manufacturer: "Ford Motor Company",
      crash: false,
      fire: false,
      numberOfInjuries: 0,
      numberOfDeaths: 0,
      dateOfIncident: "01/15/2019",
      dateComplaintFiled: "01/20/2019",
      components: "POWER TRAIN",
      summary:
        "While driving at highway speed the transmission abruptly downshifted without warning. The vehicle was taken to the dealer where a speed sensor fault was diagnosed.",
    },
    {
      odiNumber: 11498765,
      manufacturer: "Ford Motor Company",
      crash: false,
      fire: false,
      numberOfInjuries: 0,
      numberOfDeaths: 0,
      dateOfIncident: "06/03/2018",
      dateComplaintFiled: "06/10/2018",
      components: "SERVICE BRAKES",
      summary:
        "Brake pedal slowly sank to the floor when stopped at a light. Master cylinder was found to be leaking into the booster and was replaced.",
    },
  ],
};

const ncapModels = {
  Count: 1,
  Results: [{ Make: "FORD", Model: "F-150" }],
};

const ncapVariants = {
  Count: 2,
  Results: [
    { VehicleDescription: "2013 Ford F-150 SuperCrew 4WD", VehicleId: 7621 },
    { VehicleDescription: "2013 Ford F-150 SuperCrew 2WD", VehicleId: 7620 },
  ],
};

const ncapRating = {
  Count: 1,
  Results: [
    {
      VehicleDescription: "2013 Ford F-150 SuperCrew 4WD",
      VehicleId: 7621,
      OverallRating: "4",
      OverallFrontCrashRating: "4",
      FrontCrashDriversideRating: "4",
      FrontCrashPassengersideRating: "4",
      OverallSideCrashRating: "5",
      SideCrashDriversideRating: "5",
      SideCrashPassengersideRating: "5",
      SidePoleCrashRating: "5",
      RolloverRating: "3",
      RolloverPossibility: 0.207,
      ComplaintsCount: 1345,
      RecallsCount: 16,
      InvestigationCount: 2,
      VehiclePicture: "",
    },
  ],
};

const epaMakes = {
  menuItem: [
    { text: "Ford", value: "Ford" },
    { text: "BMW", value: "BMW" },
    { text: "Mercedes-Benz", value: "Mercedes-Benz" },
  ],
};

const epaModels = {
  menuItem: [
    { text: "F150 Pickup 2WD", value: "F150 Pickup 2WD" },
    { text: "F150 Pickup 4WD", value: "F150 Pickup 4WD" },
  ],
};

const epaOptions = {
  menuItem: [
    { text: "6 cyl, 3.5 L, Automatic 6-spd, Turbo", value: "33064" },
    { text: "8 cyl, 5.0 L, Automatic 6-spd", value: "33065" },
  ],
};

const epaVehicle = {
  id: 33064,
  year: 2013,
  make: "Ford",
  model: "F150 Pickup 4WD",
  city08: 15,
  highway08: 21,
  comb08: 17,
  fuelType1: "Regular Gasoline",
  displ: "3.5",
  cylinders: "6",
  trany: "Automatic 6-spd",
  drive: "4-Wheel or All-Wheel Drive",
  co2TailpipeGpm: 522,
  atvType: "",
  rangeCity: 0,
  range: 0,
};

const productsModels = {
  count: 1,
  results: [{ modelYear: "2013", make: "FORD", model: "F-150" }],
};

/** Ordered: more specific URL patterns first. */
const FIXTURES: Array<{ test: (url: string) => boolean; data: unknown }> = [
  { test: (u) => u.includes("/DecodeVinValues/"), data: vpicDecode },
  { test: (u) => u.includes("recallsByVehicle"), data: recalls },
  { test: (u) => u.includes("complaintsByVehicle"), data: complaints },
  { test: (u) => u.includes("products/vehicle/models"), data: productsModels },
  { test: (u) => u.includes("SafetyRatings/VehicleId/"), data: ncapRating },
  { test: (u) => u.includes("SafetyRatings/") && u.includes("/model/"), data: ncapVariants },
  { test: (u) => u.includes("SafetyRatings/"), data: ncapModels },
  { test: (u) => u.includes("/vehicle/menu/make"), data: epaMakes },
  { test: (u) => u.includes("/vehicle/menu/model"), data: epaModels },
  { test: (u) => u.includes("/vehicle/menu/options"), data: epaOptions },
  { test: (u) => u.includes("fueleconomy.gov/ws/rest/vehicle/"), data: epaVehicle },
];

export function matchFixture(url: string): unknown | undefined {
  return FIXTURES.find((f) => f.test(url))?.data;
}
