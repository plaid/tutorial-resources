"use strict";
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { Configuration, PlaidEnvironments, PlaidApi } = require("plaid");
const { getUserRecord, updateUserRecord } = require("./user_utils");
const {
  FIELD_ACCESS_TOKEN,
  FIELD_USER_ID,
  FIELD_USER_STATUS,
  FIELD_ITEM_ID,
} = require("./constants");

const APP_PORT = process.env.APP_PORT || 8000;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

const server = app.listen(APP_PORT, function () {
  console.log(`Server is up and running at http://localhost:${APP_PORT}/`);
});

// Set up the Plaid client
/*
const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
  },
});

const plaidClient = new PlaidApi(plaidConfig);
*/

/**
 * Fetches some info about our user from our "database" and returns it to
 * the client
 */
app.get("/server/get_user_info", async (req, res, next) => {
  try {
    const currentUser = await getUserRecord();
    console.log("currentUser", currentUser);
    res.json({
      userId: currentUser["userId"],
      userStatus: currentUser["userStatus"],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Generates a Link token to be used by the client.
 */
app.post("/server/generate_link_token", async (req, res, next) => {
  try {
    /*
    // Part 1

    const currentUser = await getUserRecord();
    const userId = currentUser[FIELD_USER_ID];
    const createTokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: "iOS Demo",
      country_codes: ["US"],
      language: "en",
      products: ["auth"],
      webhook: "https://sample-webhook-uri.com",
    });
    const data = createTokenResponse.data;
    console.log("createTokenResponse", data);
    */

    /*
    res.json({ expiration: data.expiration, linkToken: data.link_token });
    return;
   */
    res.json({ todo: "This endpoint has not yet been implemented" });
  } catch (error) {
    console.log(
      "Running into an error! Note that if you have an error when creating a " +
        "link token, it's frequently because you have the wrong client_id " +
        "or secret for the environment, or you forgot to copy over your " +
        ".env.template file to.env."
    );
    next(error);
  }
});

/**
 * Swap the public token for an access token, so we can access account info
 * in the future
 */
app.post("/server/swap_public_token", async (req, res, next) => {
  try {
    /*
    // Part 1

    const result = await plaidClient.itemPublicTokenExchange({
      public_token: req.body.public_token,
    });
    const data = result.data;
    console.log("publicTokenExchange data", data);
    */

    /*
    const updateData = {};
    updateData[FIELD_ACCESS_TOKEN] = data.access_token;
    updateData[FIELD_ITEM_ID] = data.item_id;
    updateData[FIELD_USER_STATUS] = "connected";
    await updateUserRecord(updateData);
    console.log("publicTokenExchange data", data);
    res.json({ success: true });
    return;
    */

    res.json({ todo: "This endpoint has not yet been implemented" });
  } catch (error) {
    next(error);
  }
});

/**
 * Grabs auth info for the user and returns it as a big ol' JSON object
 */
app.get("/server/simple_auth", async (req, res, next) => {
  try {
    /*
    // Part 1

    const currentUser = await getUserRecord();
    const accessToken = currentUser[FIELD_ACCESS_TOKEN];
    const authResponse = await plaidClient.authGet({
      access_token: accessToken,
    });

    console.dir(authResponse.data, { depth: null });
    */

    /*
    const accountMask = authResponse.data.accounts[0].mask;
    const accountName = authResponse.data.accounts[0].name;
    const accountId = authResponse.data.accounts[0].account_id;

    // Since I don't know if these arrays are in the same order, make sure we're
    // fetching the right one by account_id
    
    const routingNumber = authResponse.data.numbers.ach.find(
      (e) => e.account_id === accountId
    ).routing;
    res.json({ routingNumber, accountMask, accountName });
    return;
    */

    res.json({ todo: "This endpoint has not yet been implemented" });
  } catch (error) {
    next(error);
  }
});

const errorHandler = function (err, req, res, next) {
  console.error(`Your error:`);
  console.error(err);
  if (err.response?.data != null) {
    res.status(500).send(err.response.data);
  } else {
    res.status(500).send({
      error_code: "OTHER_ERROR",
      error_message: "I got some other message on the server.",
    });
  }
};
app.use(errorHandler);
