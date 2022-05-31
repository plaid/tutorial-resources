"use strict";
require("dotenv").config();
const fs = require("fs/promises");
const express = require("express");
const bodyParser = require("body-parser");
const moment = require("moment");
const {
  Configuration,
  PlaidEnvironments,
  PlaidApi,
  SandboxItemFireWebhookRequestWebhookCodeEnum,
  WebhookType,
} = require("plaid");

const APP_PORT = process.env.APP_PORT || 8000;
const USER_DATA_FILE = "user_data.json";

const FIELD_ACCESS_TOKEN = "accessToken";
const FIELD_USER_STATUS = "userStatus";

let webhookUrl =
  process.env.WEBHOOK_URL || "https://www.example.com/server/plaid_webhook";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

const server = app.listen(APP_PORT, function () {
  console.log(`Server is up and running at http://localhost:${APP_PORT}/`);
});

// Set up the Plaid client
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

const getUserRecord = async function () {
  try {
    const userData = await fs.readFile(USER_DATA_FILE, {
      encoding: "utf8",
    });
    const userDataObj = await JSON.parse(userData);
    console.log(`Retrieved userData ${userData}`);
    return userDataObj;
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("No user object found. We'll make one from scratch.");
      return null;
    }
    // Might happen first time, if file doesn't exist
    console.log("Got an error", error);
    return null;
  }
};

let userRecord;
(async () => {
  userRecord = await getUserRecord();
  if (userRecord == null) {
    userRecord = {};
    userRecord[FIELD_ACCESS_TOKEN] = null;
    userRecord[FIELD_USER_STATUS] = "disconnected";
  }
})();

/**
 * Updates the user record in memory and writes it to a file. In a real
 * application, you'd be writing to a database.
 */
const updateUserRecord = async function (key, val) {
  userRecord[key] = val;
  try {
    const dataToWrite = JSON.stringify(userRecord);
    await fs.writeFile(USER_DATA_FILE, dataToWrite, {
      encoding: "utf8",
      mode: 0o600,
    });
    console.log(`User record ${dataToWrite} written to file.`);
  } catch (error) {
    console.log("Got an error: ", error);
  }
};

/**
 * Just returns whether or not we're connected to Plaid
 */
app.get("/server/get_user_info", async (req, res, next) => {
  try {
    res.json({
      user_status: userRecord[FIELD_USER_STATUS],
    });
  } catch (error) {
    next(error);
  }
});

const basicLinkTokenObject = {
  user: { client_user_id: "testUser" },
  client_name: "Webhook Test App",
  language: "en",
  products: ["transactions", "assets"],
  country_codes: ["US"],
  webhook: webhookUrl,
};

/**
 * Generates a link token to be used by the client.
 */
app.post("/server/generate_link_token", async (req, res, next) => {
  try {
    const response = await plaidClient.linkTokenCreate(basicLinkTokenObject);
    console.log(basicLinkTokenObject);
    res.json(response.data);
  } catch (error) {
    console.log(`Running into an error!`);
    next(error);
  }
});

/**
 * Swap the public token for an access token, so we can access transaction info
 * in the future
 */
app.post("/server/swap_public_token", async (req, res, next) => {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: req.body.public_token,
    });
    console.log(`You got back ${JSON.stringify(response.data)}`);
    await updateUserRecord(FIELD_ACCESS_TOKEN, response.data.access_token);
    await updateUserRecord(FIELD_USER_STATUS, "connected");

    res.json({ status: "success" });
  } catch (error) {
    next(error);
  }
});

/**
 * Grabs transaction info for the user and return it as a big ol' JSON object
 */
app.get("/server/transactions", async (req, res, next) => {
  try {
    const access_token = await userRecord[FIELD_ACCESS_TOKEN];
    const startDate = moment().subtract(30, "days").format("YYYY-MM-DD");
    const endDate = moment().format("YYYY-MM-DD");

    const transactionResponse = await plaidClient.transactionsGet({
      access_token: access_token,
      start_date: startDate,
      end_date: endDate,
      options: { count: 10 },
    });
    res.json(transactionResponse.data);
  } catch (error) {
    next(error);
  }
});

// Fetches balance data
app.get("/server/balances", async (req, res, next) => {
  try {
    const access_token = userRecord[FIELD_ACCESS_TOKEN];
    const balanceResponse = await plaidClient.accountsBalanceGet({
      access_token: access_token,
      options: {
        min_last_updated_datetime: "2020-01-01T00:00:00Z",
      },
    });
    res.json(balanceResponse.data);
  } catch (error) {
    next(error);
  }
});

/**
 * Kicks off the request to create an asset report. In non-sandbox mode
 * this could take several minutes to complete.
 */
app.get("/server/create_asset_report", async (req, res, next) => {
  try {
    const access_token = userRecord[FIELD_ACCESS_TOKEN];
    const reportResponse = await plaidClient.assetReportCreate({
      access_tokens: [access_token],
      days_requested: 30,
      options: {
        user: { first_name: "Jane", last_name: "Foster" },
        webhook: webhookUrl,
      },
    });
    res.json(reportResponse.data);
  } catch (error) {
    next(error);
  }
});

/**
 * Ask Plaid to fire off a new webhook. Useful for testing webhooks... and
 * not much else.
 */
app.post("/server/fire_test_webhook", async (req, res, next) => {
  try {
    res.json({ todo: "Implement this feature" });
  } catch (error) {
    next(error);
  }
});

/**
 * Tell Plaid to use a new URL for our webhooks
 */
app.post("/server/update_webhook", async (req, res, next) => {
  try {
    res.json({ todo: "Implement this feature" });
  } catch (error) {
    next(error);
  }
});

/**
 * We've received a webhook! We should probably so something with it.
 */
app.post("/server/receive_webhook", async (req, res, next) => {
  try {
    res.json({ todo: "Implement this feature" });
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
