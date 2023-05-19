const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
const crypto = require("crypto");
const { SimpleTransaction } = require("./simpleTransactionObject");

// You may want to have this point to different databases based on your environment
const databaseFile = "./database/appdata.db";
let db;

// Set up our database
const existingDatabase = fs.existsSync(databaseFile);
const createUsersTableSQL =
  "CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT NOT NULL)";
const createItemsTableSQL =
  "CREATE TABLE items (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, " +
  "access_token TEXT NOT NULL, transaction_cursor TEXT, bank_name TEXT, " +
  "is_active INTEGER NOT_NULL DEFAULT 1, " +
  "FOREIGN KEY(user_id) REFERENCES users(id))";
const createAccountsTableSQL =
  "CREATE TABLE accounts (id TEXT PRIMARY KEY, item_id TEXT NOT NULL, " +
  "name TEXT, FOREIGN KEY(item_id) REFERENCES items(id))";
const createTransactionsTableSQL =
  "CREATE TABLE transactions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, " +
  "account_id TEXT NOT_NULL, category TEXT, date TEXT, " +
  "authorized_date TEXT, name TEXT, amount REAL, currency_code TEXT, " +
  "is_removed INTEGER NOT_NULL DEFAULT 0, " +
  "FOREIGN KEY(user_id) REFERENCES users(id), " +
  "FOREIGN KEY(account_id) REFERENCES accounts(id))";

dbWrapper
  .open({ filename: databaseFile, driver: sqlite3.Database })
  .then(async (dBase) => {
    db = dBase;
    try {
      if (!existingDatabase) {
        // Database doesn't exist yet -- let's create it!
        await db.run(createUsersTableSQL);
        await db.run(createItemsTableSQL);
        await db.run(createAccountsTableSQL);
        await db.run(createTransactionsTableSQL);
      } else {
        // Avoids a rare bug where the database gets created, but the tables don't
        const tableNames = await db.all(
          "SELECT name FROM sqlite_master WHERE type='table'"
        );
        const tableNamesToCreationSQL = {
          users: createUsersTableSQL,
          items: createItemsTableSQL,
          accounts: createAccountsTableSQL,
          transactions: createTransactionsTableSQL,
        };
        for (const [tableName, creationSQL] of Object.entries(
          tableNamesToCreationSQL
        )) {
          if (!tableNames.some((table) => table.name === tableName)) {
            console.log(`Creating ${tableName} table`);
            await db.run(creationSQL);
          }
        }
        console.log("Database is up and running!");
        sqlite3.verbose();
      }
    } catch (dbError) {
      console.error(dbError);
    }
  });

const debugExposeDb = function () {
  return db;
};

const getItemIdsForUser = async function (userId) {
  const items = await db.all(
    `SELECT id FROM items WHERE user_id=? AND is_active = 1`,
    userId
  );
  return items;
};

const getItemsAndAccessTokensForUser = async function (userId) {
  const items = await db.all(
    `SELECT id, access_token FROM items WHERE user_id=? AND is_active = 1 `,
    userId
  );
  return items;
};

const getAccountIdsForItem = async function (itemId) {
  const accounts = await db.all(
    `SELECT id FROM accounts WHERE item_id = ?`,
    itemId
  );
  return accounts;
};

const confirmItemBelongsToUser = async function (possibleItemId, userId) {
  const result = await db.get(
    `SELECT id FROM items WHERE id = ? and user_id = ?`,
    possibleItemId,
    userId
  );
  console.log(result);
  if (result && result.id === possibleItemId) {
    return true;
  } else {
    console.warn(
      `User ${userId} claims to own item they don't: ${possibleItemId}`
    );
    return false;
  }
};

const deactivateItem = async function (itemId) {
  const updateResult = await db.run(
    `UPDATE items SET access_token = 'REVOKED', is_active = 0 WHERE id = ?`,
    itemId
  );
  return updateResult;
  // If your user wanted all the data associated with this bank removed, you
  // could...
  // - Delete transactions for accounts belonging to this item
  // - Delete accounts that belong to this item
  // - Delete the item itself from the database
};

const addUser = async function (userId, username) {
  const result = await db.run(
    `INSERT INTO users(id, username) VALUES("${userId}", "${username}")`
  );
  return result;
};

const getUserList = async function () {
  const result = await db.all(`SELECT id, username FROM users`);
  return result;
};

const getUserRecord = async function (userId) {
  const result = await db.get(`SELECT * FROM users WHERE id=?`, userId);
  return result;
};

const getBankNamesForUser = async function (userId) {
  const result = await db.all(
    `SELECT id, bank_name
      FROM items WHERE user_id=? AND is_active = 1`,
    userId
  );
  return result;
};

const addItem = async function (itemId, userId, accessToken) {
  const result = await db.run(
    `INSERT INTO items(id, user_id, access_token) VALUES(?, ?, ?)`,
    itemId,
    userId,
    accessToken
  );
  return result;
};

const addBankNameForItem = async function (itemId, institutionName) {
  const result = await db.run(
    `UPDATE items SET bank_name=? WHERE id =?`,
    institutionName,
    itemId
  );
  return result;
};

const addAccount = async function (accountId, itemId, acctName) {
  await db.run(
    `INSERT OR IGNORE INTO accounts(id, item_id, name) VALUES(?, ?, ?)`,
    accountId,
    itemId,
    acctName
  );
};

const getItemInfo = async function (itemId) {
  const result = await db.get(
    `SELECT user_id, access_token, transaction_cursor FROM items WHERE id=?`,
    itemId
  );
  return result;
};

const getItemInfoForUser = async function (itemId, userId) {
  const result = await db.get(
    `SELECT user_id, access_token, transaction_cursor FROM items 
    WHERE id= ? AND user_id = ?`,
    itemId,
    userId
  );
  return result;
};

/**
 * Add a new transaction to our database
 *
 * @param {SimpleTransaction} transactionObj
 */
const addNewTransaction = async function (transactionObj) {
  try {
    const result = await db.run(
      `INSERT INTO transactions
    (id, user_id, account_id, category, date, authorized_date, name, amount, 
      currency_code)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
      transactionObj.id,
      transactionObj.userId,
      transactionObj.accountId,
      transactionObj.category,
      transactionObj.date,
      transactionObj.authorizedDate,
      transactionObj.name,
      transactionObj.amount,
      transactionObj.currencyCode
    );

    if (transactionObj.pendingTransactionId != null) {
      // This might be a good time to copy over any user-created values from
      // that other transaction to this one.
    }

    return result;
  } catch (error) {
    console.log(
      `Looks like I'm encountering an error. ${JSON.stringify(error)}`
    );
    if (error.code === "SQLITE_CONSTRAINT") {
      console.log(`Maybe I'm reusing a cursor?`);
    }
  }
};

/**
 * Modify an existing transaction in our database
 *
 * @param {SimpleTransaction} transactionObj
 */
const modifyExistingTransaction = async function (transactionObj) {
  try {
    const result = await db.run(
      `UPDATE transactions 
      SET account_id = ?, category = ?, date = ?, 
      authorized_date = ?, name = ?, amount = ?, currency_code = ? 
      WHERE id = ?
      `,
      transactionObj.accountId,
      transactionObj.category,
      transactionObj.date,
      transactionObj.authorizedDate,
      transactionObj.name,
      transactionObj.amount,
      transactionObj.currencyCode,
      transactionObj.id
    );
    return result;
  } catch (error) {
    console.log(
      `Looks like I'm encountering an error. ${JSON.stringify(error)}`
    );
  }
};

/**
 * Mark a transaction as removed from our database
 *
 * @param {string} transactionId
 */
const markTransactionAsRemoved = async function (transactionId) {
  try {
    const updatedId = transactionId + "-REMOVED-" + crypto.randomUUID();
    const result = await db.run(
      `UPDATE transactions SET id = ?, is_removed = 1 WHERE id = ?`,
      updatedId,
      transactionId
    );
    return result;
  } catch (error) {
    console.log(
      `Looks like I'm encountering an error. ${JSON.stringify(error)}`
    );
  }
};

/**
 * Actually delete a transaction from the database
 *
 * @param {string} transactionId
 */
const deleteExistingTransaction = async function (transactionId) {
  try {
    const result = await db.run(
      `DELETE FROM transactions WHERE id = ?`,
      transactionId
    );
    return result;
  } catch (error) {
    console.log(
      `Looks like I'm encountering an error. ${JSON.stringify(error)}`
    );
  }
};

/**
 * Fetch transactions for our user from the database
 *
 * @param {string} userId
 * @param {number} maxNum
 */
const getTransactionsForUser = async function (userId, maxNum) {
  const results = await db.all(
    `SELECT transactions.*,
      accounts.name as account_name,
      items.bank_name as bank_name
    FROM transactions
    JOIN accounts ON transactions.account_id = accounts.id
    JOIN items ON accounts.item_id = items.id
    WHERE transactions.user_id = ?
      and is_removed = 0
    ORDER BY date DESC
    LIMIT ?`,
    userId,
    maxNum
  );
  return results;
};

/**
 * Save our cursor to the database
 *
 * @param {string} transactionCursor
 * @param {string} itemId
 */
const saveCursorForItem = async function (transactionCursor, itemId) {
  try {
    await db.run(
      `UPDATE items SET transaction_cursor = ? WHERE id = ?`,
      transactionCursor,
      itemId
    );
  } catch (error) {
    console.error(
      `It's a big problem that I can't save my cursor. ${JSON.stringify(error)}`
    );
  }
};

module.exports = {
  debugExposeDb,
  getItemIdsForUser,
  getItemsAndAccessTokensForUser,
  getAccountIdsForItem,
  confirmItemBelongsToUser,
  deactivateItem,
  addUser,
  getUserList,
  getUserRecord,
  getBankNamesForUser,
  addItem,
  addBankNameForItem,
  addAccount,
  getItemInfo,
  getItemInfoForUser,
  addNewTransaction,
  modifyExistingTransaction,
  deleteExistingTransaction,
  markTransactionAsRemoved,
  getTransactionsForUser,
  saveCursorForItem,
};
