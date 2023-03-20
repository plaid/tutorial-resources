const express = require("express");
const { getLoggedInUserId } = require("../utils");
const db = require("../db");
const { plaidClient } = require("../plaid");
const {
  SandboxItemFireWebhookRequestWebhookCodeEnum,
  WebhookType,
} = require("plaid");

const router = express.Router();

/**
 * Sometimes you wanna run some custom server code. This seemed like the
 * easiest way to do it. Don't do this in a real application.
 */
router.post("/run", async (req, res, next) => {
  try {
    const userId = getLoggedInUserId(req);
    res.json({ status: "done" });
  } catch (error) {
    next(error);
  }
});

/**
 * This code will eventually be used to generate a test webhook, which can
 * be useful in sandbox mode where webhooks aren't quite generated like
 * they are in production.
 */
router.post("/generate_webhook", async (req, res, next) => {
  try {
    const userId = getLoggedInUserId(req);
    const itemsAndTokens = await db.getItemsAndAccessTokensForUser(userId);
    const randomItem =
      itemsAndTokens[Math.floor(Math.random() * itemsAndTokens.length)];
    const accessToken = randomItem.access_token;
    const result = await plaidClient.sandboxItemFireWebhook({
      webhook_code:
        SandboxItemFireWebhookRequestWebhookCodeEnum.SyncUpdatesAvailable,
      access_token: accessToken,
    });
    res.json(result.data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
