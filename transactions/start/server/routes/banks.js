const express = require("express");
const db = require("../db");
const { getLoggedInUserId } = require("../utils");
const { plaidClient } = require("../plaid");

const router = express.Router();

router.get("/list", async (req, res, next) => {
  try {
    const userId = getLoggedInUserId(req);
    const result = await db.getBankNamesForUser(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/deactivate", async (req, res, next) => {
  try {
    res.json({ todo: "Implement this method" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
