const express = require("express");
const { getLoggedInUserId } = require("../utils");
const db = require("../db");
const { plaidClient } = require("../plaid");
const { setTimeout } = require("timers/promises");
const { SimpleTransaction } = require("../simpleTransactionObject");

const router = express.Router();

/**
 * This will ask our server to make a transactions sync call
 * against all the items it has for a particular user. This is one way
 * you can keep your transaction data up to date, but it's preferable
 * to just fetch data for a single item in response to a webhook.
 */
router.post("/sync", async (req, res, next) => {
  try {
    const userId = getLoggedInUserId(req);
    const items = await db.getItemIdsForUser(userId);
    console.log(items);
    const fullResults = await Promise.all(
      items.map(async (item) => await syncTransactions(item.id))
    );
    res.json({ completeResults: fullResults });
  } catch (error) {
    console.log(`Running into an error!`);
    next(error);
  }
});

const fetchNewSyncData = async function (
  accessToken,
  initialCursor,
  retriesLeft = 3
) {
  const allData = {
    added: [],
    removed: [],
    modified: [],
    nextCursor: initialCursor,
  };
  if (retriesLeft <= 0) {
    console.error("Too many retries!");
    // We're just going to return no data and keep our original cursor. We can try again later.
    return allData;
  }
  try {
    let keepGoing = false;
    do {
      const results = await plaidClient.transactionsSync({
        access_token: accessToken,
        options: {
          include_personal_finance_category: true,
        },
        cursor: allData.nextCursor,
      });
      const newData = results.data;
      allData.added = allData.added.concat(newData.added);
      allData.modified = allData.modified.concat(newData.modified);
      allData.removed = allData.removed.concat(newData.removed);
      allData.nextCursor = newData.next_cursor;
      keepGoing = newData.has_more;
      console.log(
        `Added: ${newData.added.length} Modified: ${newData.modified.length} Removed: ${newData.removed.length} `
      );

      // if (Math.random() < 0.5) {
      //   throw new Error("SIMULATED PLAID SYNC ERROR");
      // }
    } while (keepGoing === true);
    return allData;
  } catch (error) {
    // If you want to see if this is a sync mutation error, you can look at
    // error?.response?.data?.error_code
    console.log(
      `Oh no! Error! ${JSON.stringify(
        error
      )} Let's try again from the beginning!`
    );
    await setTimeout(1000);
    return fetchNewSyncData(accessToken, initialCursor, retriesLeft - 1);
  }
};

/**
 * Given an item ID, this will fetch all transactions for all accounts
 * associated with this item using the sync API. We can call this manually
 * using the /sync endpoint above, or we can call this in response
 * to a webhook
 */

// Want to try testing this on sandbox? Try adding code like this! You'll
// need to update these transaction IDs to what's in your database.
//
// allData.modified.push({
//   transaction_id: "EXISTING_TRANSACTION_ID_GOES_HERE",
//   account_id: "use_an_existing_account_id_if_you_can",
//   personal_finance_category: { primary: "TRANSPORTATION" },
//   date: "2022-12-31",
//   authorized_date: "2022-12-30",
//   merchant_name: "Fancy-shmancy Uber",
//   amount: 20.0,
//   iso_currency_code: "USD",
// });

// allData.removed.push({
//   transaction_id: "8Mr1leaRMVudPjV8G9XQcJ6AeEX4JecKQQEdJ",
// });

const syncTransactions = async function (itemId) {
  // Step 1: Retrieve our access token and cursor from the database
  const {
    access_token: accessToken,
    transaction_cursor: transactionCursor,
    user_id: userId,
  } = await db.getItemInfo(itemId);

  const summary = { added: 0, removed: 0, modified: 0 };
  const allData = await fetchNewSyncData(accessToken, transactionCursor);

  // STEP 2: Save new transactions to the database
  await Promise.all(
    allData.added.map(async (txnObj) => {
      console.log(`I want to add ${txnObj.transaction_id}`);
      const result = await db.addNewTransaction(
        SimpleTransaction.fromPlaidTransaction(txnObj, userId)
      );
      if (result) {
        summary.added += result.changes;
      }
    })
  );

  // STEP 3: Update modified transactions in our database
  await Promise.all(
    allData.modified.map(async (txnObj) => {
      console.log(`I want to modify ${txnObj.transaction_id}`);
      const result = await db.modifyExistingTransaction(
        SimpleTransaction.fromPlaidTransaction(txnObj, userId)
      );
      if (result) {
        summary.modified += result.changes;
      }
    })
  );

  // STEP 4: Do something in our database with the removed transactions
  await Promise.all(
    allData.removed.map(async (txnObj) => {
      console.log(`I want to remove ${txnObj.transaction_id}`);
      // const result = await db.deleteExistingTransaction(
      //   txnObj.transaction_id
      // );
      const result = await db.markTransactionAsRemoved(txnObj.transaction_id);
      if (result) {
        summary.removed += result.changes;
      }
    })
  );

  console.log(`The last cursor value was ${allData.nextCursor}`);
  // Step 5: Save our cursor value to the database
  await db.saveCursorForItem(allData.nextCursor, itemId);

  console.log(summary);
  return summary;
};

/**
 * Fetch all the transactions for a particular user (up to a limit)
 * This is really just a simple database query, since our server has already
 * fetched these items using the syncTransactions call above
 *
 */
router.get("/list", async (req, res, next) => {
  try {
    const userId = getLoggedInUserId(req);
    const maxCount = req.params.maxCount ?? 50;
    const transactions = await db.getTransactionsForUser(userId, maxCount);
    res.json(transactions);
  } catch (error) {
    console.log(`Running into an error!`);
    next(error);
  }
});

module.exports = { router, syncTransactions };
