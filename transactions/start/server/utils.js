const db = require("./db");

const getLoggedInUserId = function (req) {
  return req.cookies["signedInUser"];
};

module.exports = { getLoggedInUserId };
