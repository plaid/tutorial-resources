/**
 * Just a bunch of helper functions that handle reading and writing files
 * to represent our "logged in" user. In a real server, this would be writing
 * to a database and determining the user's identity using some actual auth.
 */

const fs = require("fs/promises");
const {
  FIELD_ACCESS_TOKEN,
  FIELD_USER_ID,
  FIELD_USER_STATUS,
  FIELD_ITEM_ID,
} = require("./constants");

const USER_FILES_FOLDER = "user_files";
const CURR_USER_ID = process.env.USER_ID || "1";

/**
 * Try to retrieve the user record from our local filesystem and return it
 * as a JSON object
 */
const _fetchLocalFile = async function () {
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

const getUserRecord = async function () {
  // Attempt to read in our "logged-in user" by looking for a file in the
  // "user_files" folder.
  let userRecord = await _fetchLocalFile();
  if (userRecord == null) {
    userRecord = {};
    userRecord[FIELD_ACCESS_TOKEN] = null;
    userRecord[FIELD_USER_ID] = CURR_USER_ID;
    userRecord[FIELD_USER_STATUS] = "disconnected";
    userRecord[FIELD_ITEM_ID] = null;

    // Force a file save
    await _writeUserRecordToFile(userRecord);
  }
  return userRecord;
};

const _writeUserRecordToFile = async function (userRecord) {
  const userDataFile = `${USER_FILES_FOLDER}/user_data_${CURR_USER_ID}.json`;
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
 * Updates the user record in memory and writes it to a file. In a real
 * application, you'd be writing to a database.
 */
const updateUserRecord = async function (keyValDictionary) {
  let userRecord = await getUserRecord();
  userRecord = { ...userRecord, ...keyValDictionary };
  await _writeUserRecordToFile(userRecord);
};

module.exports = {
  getUserRecord,
  updateUserRecord,
};
