import { initializeLink, startMicroVerification } from "./connect.js";
import { enableSection, callMyServer, showOutput } from "./utilities.js";

export const checkConnectedStatus = async function () {
  const connectedData = await callMyServer("/server/get_user_info");
  if (connectedData.user_status === "connected") {
    document.querySelector("#connectedUI").classList.remove("d-none");
    document.querySelector("#disconnectedUI").classList.add("d-none");
    enableSection("");
  } else {
    document.querySelector("#connectedUI").classList.add("d-none");
    document.querySelector("#disconnectedUI").classList.remove("d-none");
    initializeLink();
  }
};

const getProcessorToken = async function () {
  // TODO: Fill this out
};

const getAccountStatus = async function () {
  const accountData = await callMyServer("/server/get_account_status");
  showOutput(JSON.stringify(accountData));
};

const refreshUserStatus = async function () {
  const updatedData = await callMyServer("/server/get_user_info");
};

const displayAuthDetails = function (authStatus) {
  // TODO: Fill this out
};

const refreshAuth = async function () {
  // TODO: Fill this out
};

const forceAutoDeposits = async function () {
  // TODO: Fill this out
};

const getAuthInfo = async function () {
  // TODO: Fill this out
};

const verifyMicros = async function () {
  // TODO: Fill this out
};

const postPendingMicros = async function () {
  // TODO: Fill this out
};

const checkForMicros = async function () {
  // TODO: Fill this out
};

// Connect selectors to functions
const selectorsAndFunctions = {
  "#getAuthInfo": getAuthInfo,
  "#getProcessorToken": getProcessorToken,
  "#getAccountStatus": getAccountStatus,
  "#refreshAuthStatus": refreshUserStatus,
  "#serverRefresh": refreshAuth,
  "#impatient": forceAutoDeposits,
  "#verifyMicros": verifyMicros,
  "#postPendingMicros": postPendingMicros,
  "#checkForMicros": checkForMicros,
};

Object.entries(selectorsAndFunctions).forEach(([sel, fun]) => {
  if (document.querySelector(sel) == null) {
    console.warn(`Hmm... couldn't find ${sel}`);
  } else {
    document.querySelector(sel)?.addEventListener("click", fun);
  }
});
checkConnectedStatus();
