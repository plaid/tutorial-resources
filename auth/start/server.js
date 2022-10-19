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
  SandboxItemSetVerificationStatusRequestVerificationStatusEnum,
  BankTransferEventType,
} = require("plaid");

const APP_PORT = process.env.APP_PORT || 8000;
const CURR_USER_ID = process.env.USER_ID || "1";
const LINK_CUSTOM_NAME = process.env.LINK_CUSTOM_NAME || null;
const USER_FILES_FOLDER = "user_files";
const FIELD_ACCESS_TOKEN = "accessToken";
const FIELD_USER_STATUS = "userStatus";
const FIELD_AUTH_STATUS = "authStatus";
const FIELD_ACCOUNT_ID = "accountId";
const FIELD_MICROS_READY = "microsReady";

const WEBHOOK_URL =
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

/**
 * Try to retrieve the user record from our local filesystem and return it
 * as a JSON object
 */
const getUserRecord = async function () {
  const userDataFile = `${USER_FILES_FOLDER}/user_data_${CURR_USER_ID}.json`;
  try {
    const userData = await fs.readFile(userDataFile, {
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

// When we start up our server, we attempt to read in our "logged-in user"
// by looking for a file in the "user_files" folder
let userRecord;
(async () => {
  userRecord = await getUserRecord();
  if (userRecord == null) {
    userRecord = {};
    userRecord[FIELD_ACCESS_TOKEN] = null;
    userRecord[FIELD_USER_STATUS] = "disconnected";
    userRecord[FIELD_AUTH_STATUS] = "unknown";
    userRecord[FIELD_ACCOUNT_ID] = null;
    userRecord[FIELD_MICROS_READY] = false;

    // Force a file save
    await updateUserRecord(FIELD_ACCESS_TOKEN, null);
  }
})();

/**
 * Updates the user record in memory and writes it to a file. In a real
 * application, you'd be writing to a database.
 */
const updateUserRecord = async function (key, val) {
  const userDataFile = `${USER_FILES_FOLDER}/user_data_${CURR_USER_ID}.json`;
  userRecord[key] = val;
  try {
    const dataToWrite = JSON.stringify(userRecord);
    await fs.writeFile(userDataFile, dataToWrite, {
      encoding: "utf8",
      mode: 0o600,
    });
    console.log(`User record ${dataToWrite} written to file.`);
  } catch (error) {
    console.log("Got an error: ", error);
  }
};

/**
 * Fetches some info about our user from our "database" and returns it to
 * the client
 */
app.get("/server/get_user_info", async (req, res, next) => {
  try {
    res.json({
      user_status: userRecord[FIELD_USER_STATUS],
      auth_status: userRecord[FIELD_AUTH_STATUS],
      account_number: userRecord[FIELD_ACCOUNT_ID],
      micros_ready: userRecord[FIELD_MICROS_READY],
      user_id: CURR_USER_ID,
    });
  } catch (error) {
    next(error);
  }
});

const basicLinkTokenObject = {
  user: { client_user_id: CURR_USER_ID },
  client_name: "Todd's Money Transfers",
  link_customization_name: LINK_CUSTOM_NAME,
  language: "en",
  products: [],
  country_codes: ["US"],
  webhook: WEBHOOK_URL,
};

/**
 * Generates a Link token to be used by the client.
 */
app.post("/server/generate_link_token", async (req, res, next) => {
  try {
    const linkTokenObject = {
      ...basicLinkTokenObject,
      products: ["transactions"],
    };
    const tokenResponse = await plaidClient.linkTokenCreate(linkTokenObject);
    res.json(tokenResponse.data);
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
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: req.body.public_token,
    });
    console.log(`Got our access token ${JSON.stringify(response.data)}`);
    await updateUserRecord(FIELD_ACCESS_TOKEN, response.data.access_token);
    await updateUserRecord(FIELD_USER_STATUS, "connected");
    await fetchAccountId(userRecord[FIELD_ACCESS_TOKEN]);
    // await refreshAuthStatus(userRecord[FIELD_ACCESS_TOKEN]);

    // Temporary: Let's just show that our access token does something!
    const testResult = await plaidClient.transactionsSync({
      access_token: userRecord[FIELD_ACCESS_TOKEN],
      count: 5,
    });
    console.dir(testResult.data, { colors: true, depth: null });

    res.json({ status: "success" });
  } catch (error) {
    next(error);
  }
});

const fetchAccountId = async function (access_token) {
  const accountResult = await plaidClient.accountsGet({
    access_token: access_token,
  });
  // This app works on the assumption that we're only allowing our user to
  // select one account per Item.
  if (userRecord[FIELD_ACCOUNT_ID] == null) {
    const accountToUse = accountResult.data.accounts[0];
    await updateUserRecord(FIELD_ACCOUNT_ID, accountToUse.account_id);
  }
};

/**
 * This will store the user's Auth status based on calling accountsGet
 */
const refreshAuthStatus = async function (access_token) {
  //TODO: Fill this out
};

/**
 * Just grabs the results for calling accounts/get. Useful for debugging
 * purposes.
 */
app.get("/server/get_account_status", async (req, res, next) => {
  try {
    const access_token = userRecord[FIELD_ACCESS_TOKEN];
    const accountResult = await plaidClient.accountsGet({
      access_token: access_token,
    });
    const accountData = accountResult.data;
    console.log(accountData);
    res.json(accountData);
  } catch (error) {
    next(error);
  }
});

/**
 * Uses Link in Update mode to create a link token for the "manually verify
 * your micro-deposits" flow
 */
app.post("/server/generate_link_token_for_micros", async (req, res, next) => {
  try {
    res.json({ todo: "Complete this function" });
  } catch (error) {
    console.log(`Running into an error!`);
    next(error);
  }
});

/**
 * Grabs auth info for the user and returns it as a big ol' JSON object
 */
app.get("/server/auth", async (req, res, next) => {
  try {
    res.json({ todo: "Complete this function" });
  } catch (error) {
    if (error.response?.data != null) {
      console.log(error.response.data);
    }
    next(error);
  }
});

app.get("/server/processor_token", async (req, res, next) => {
  try {
    res.json({ todo: "Complete this function" });
  } catch (error) {
    next(error);
  }
});

/**
 * We're going to force our server to refresh our auth status. Usually not
 * needed, but helpful sometimes for debugging
 */
app.post("/server/refresh_auth_status", async (req, res, next) => {
  try {
    res.json({ todo: "Complete this function" });
  } catch (error) {
    next(error);
  }
});

/**
 * If we don't want to wait 24 hours for Automated Microdeposits to work in
 * Sandbox, we can fake it by making this call.
 */
app.post("/server/sandbox_force_auto_deposits", async (req, res, next) => {
  try {
    res.json({ todo: "Complete this function" });
  } catch (error) {
    next(error);
  }
});

/**
 * A fairly complex call that
 * 1) Looks for any recent bank transfer calls that have been marked as "pending"
 * but not "posted"
 * 2) Calls a sandbox endpoint so that these transactions are marked as "posted"
 * 3) Fires off a "Hey! Something has happened in the Bank Transfers product"
 * webhook
 */
app.post("/server/post_pending_micros", async (req, res, next) => {
  try {
    res.json({ todo: "Complete this function" });
  } catch (error) {
    next(error);
  }
});

/**
 * Looks through all transactions from the last 12 hours and returns ones that
 * have a "pending" transaction event but don't have a corresponding "posted"
 * event. Could this be simplified? Probably!
 */
const fetchPendingNotPostedTransactions = async function () {
  // TODO: Complete this
  return [];
};

/**
 * In case you don't have webhooks set up properly, we can use this endpoint to
 * say "Pretend you received a BANK_TRANSFERS webhook"
 */
app.get("/server/check_for_posted_micros", async (req, res, next) => {
  try {
    res.json({ todo: "Complete this function" });
  } catch (error) {
    next(error);
  }
});

/**
 * This looks for any recently posted transactions from Plaid in the users
 * account. If it finds any, we update our "MICRODEPOSITS_READY" field so that
 * we can prompt our user to verify the transactions
 */
const lookForRecentPostedTransactions = async function () {
  // TODO: Complete this
};

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

/**
 * Our server running on a different port that we'll use for handling webhooks
 */
const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 8001;

const webhookApp = express();
webhookApp.use(bodyParser.urlencoded({ extended: false }));
webhookApp.use(bodyParser.json());

const webhookServer = webhookApp.listen(WEBHOOK_PORT, function () {
  console.log(
    `Webhook receiver is up and running at http://localhost:${WEBHOOK_PORT}/`
  );
});

webhookApp.post("/server/receive_webhook", async (req, res, next) => {
  try {
    console.log("Webhook received:");
    console.dir(req.body, { colors: true, depth: null });
    console.dir(req.headers, { colors: true, depth: null });

    const product = req.body.webhook_type;
    const code = req.body.webhook_code;
    switch (product) {
      case "ITEM":
        handleItemWebhook(code, req.body);
        break;
      case "AUTH":
        handleAuthWebhook(code, req.body);
        break;
      case "BANK_TRANSFERS":
        handleBankTransferWebhook(code, req.body);
        break;
      default:
        console.log(`Can't handle webhook product ${product}`);
        break;
    }
    res.json({ status: "received" });
  } catch (error) {
    next(error);
  }
});

function handleAuthWebhook(code, requestBody) {
  switch (code) {
    default:
      console.log(`No code to handle webhook code ${code}`);
      break;
  }
}
function handleBankTransferWebhook(code, requestBody) {
  switch (code) {
    default:
      console.log(`No code to handle webhook code ${code}`);
      break;
  }
}

function handleItemWebhook(code, requestBody) {
  switch (code) {
    case "ERROR":
      console.log(
        `I received this error: ${requestBody.error.error_message}| should probably ask this user to connect to their bank`
      );
      break;
    case "NEW_ACCOUNTS_AVAILABLE":
      console.log(
        `There are new accounts available at this Financial Institution! (Id: ${requestBody.item_id}) We may want to ask the user to share them with us`
      );
      break;
    case "PENDING_EXPIRATION":
      console.log(
        `We should tell our user to reconnect their bank with Plaid so there's no disruption to their service`
      );
      break;
    case "USER_PERMISSION_REVOKED":
      console.log(
        `The user revoked access to this item. We should remove it from our records`
      );
      break;
    case "WEBHOOK_UPDATE_ACKNOWLEDGED":
      console.log(`Hooray! You found the right spot!`);
      break;
    default:
      console.log(`Can't handle webhook code ${code}`);
      break;
  }
}

webhookApp.use(errorHandler);
