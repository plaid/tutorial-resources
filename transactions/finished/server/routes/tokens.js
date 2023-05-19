const express = require("express");
const escape = require("escape-html");
const { getLoggedInUserId } = require("../utils");
const db = require("../db");
const { plaidClient } = require("../plaid");
const { syncTransactions } = require("./transactions");

const router = express.Router();

const WEBHOOK_URL =
  process.env.WEBHOOK_URL || "https://www.example.com/server/receive_webhook";

/**
 * Generates a link token to be used by the client
 */
router.post("/generate_link_token", async (req, res, next) => {
  try {
    const userId = getLoggedInUserId(req);
    const userObject = { client_user_id: userId };
    const tokenResponse = await plaidClient.linkTokenCreate({
      user: userObject,
      products: ["transactions"],
      client_name: "Where'd My Money Go?",
      language: "en",
      country_codes: ["US"],
      webhook: WEBHOOK_URL,
    });
    res.json(tokenResponse.data);
  } catch (error) {
    console.log(`Running into an error!`);
    next(error);
  }
});

/**
 * Exchanges a public token for an access token. Then, fetches a bunch of
 * information about that item and stores it in our database
 */
router.post("/exchange_public_token", async (req, res, next) => {
  try {
    const userId = getLoggedInUserId(req);
    const publicToken = escape(req.body.publicToken);

    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const tokenData = tokenResponse.data;
    await db.addItem(tokenData.item_id, userId, tokenData.access_token);
    await populateBankName(tokenData.item_id, tokenData.access_token);
    await populateAccountNames(tokenData.access_token);

    // Call sync for the first time to activate the sync webhooks
    await syncTransactions(tokenData.item_id);

    res.json({ status: "success" });
  } catch (error) {
    console.log(`Running into an error!`);
    next(error);
  }
});

const populateBankName = async (itemId, accessToken) => {
  try {
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    });
    const institutionId = itemResponse.data.item.institution_id;
    if (institutionId == null) {
      return;
    }
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ["US"],
    });
    const institutionName = institutionResponse.data.institution.name;
    await db.addBankNameForItem(itemId, institutionName);
  } catch (error) {
    console.log(`Ran into an error! ${error}`);
  }
};

const populateAccountNames = async (accessToken) => {
  try {
    const acctsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });
    const acctsData = acctsResponse.data;
    const itemId = acctsData.item.item_id;
    await Promise.all(
      acctsData.accounts.map(async (acct) => {
        await db.addAccount(acct.account_id, itemId, acct.name);
      })
    );
  } catch (error) {
    console.log(`Ran into an error! ${error}`);
  }
};

module.exports = router;
