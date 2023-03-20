const express = require("express");
const escape = require("escape-html");
const { v4: uuidv4 } = require("uuid");
const { getLoggedInUserId } = require("../utils");
const db = require("../db");

const router = express.Router();

/**
 * Methods and endpoints for signing in, signing out, and creating new users.
 * For the purpose of this sample, we're simply setting / fetching a cookie that
 * contains the userID as our way of getting the ID of our signed-in user.
 */
router.post("/create", async (req, res, next) => {
  try {
    const username = escape(req.body.username);
    const userId = uuidv4();
    const result = await db.addUser(userId, username);
    console.log(`User creation result is ${JSON.stringify(result)}`);
    if (result["lastID"] != null) {
      res.cookie("signedInUser", userId, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
      });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/list", async (req, res, next) => {
  try {
    const result = await db.getUserList();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/sign_in", async (req, res, next) => {
  try {
    const userId = escape(req.body.userId);
    res.cookie("signedInUser", userId, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
    });
    res.json({ signedIn: true });
  } catch (error) {
    next(error);
  }
});

router.post("/sign_out", async (req, res, next) => {
  try {
    res.clearCookie("signedInUser");
    res.json({ signedOut: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Get the id and username of our currently logged in user, if any.
 */
router.get("/get_my_info", async (req, res, next) => {
  try {
    const userId = getLoggedInUserId(req);
    console.log(`Your userID is ${userId}`);
    let result;
    if (userId != null) {
      const userObject = await db.getUserRecord(userId);
      if (userObject == null) {
        // This probably means your cookies are messed up.
        res.clearCookie("signedInUser");
        res.json({ userInfo: null });
        return;
      } else {
        result = { id: userObject.id, username: userObject.username };
      }
    } else {
      result = null;
    }
    res.json({ userInfo: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
