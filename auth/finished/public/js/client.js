import { initializeLink, startMicroVerification } from "./connect.js";
import { enableSection, callMyServer, showOutput } from "./utilities.js";

export const checkConnectedStatus = async function () {
  const connectedData = await callMyServer("/server/get_user_info");
  if (connectedData.user_status === "connected") {
    document.querySelector("#connectedUI").classList.remove("d-none");
    document.querySelector("#disconnectedUI").classList.add("d-none");
    displayAuthDetails(connectedData.auth_status, connectedData.micros_ready);
  } else {
    document.querySelector("#connectedUI").classList.add("d-none");
    document.querySelector("#disconnectedUI").classList.remove("d-none");
    initializeLink();
  }
};

const getProcessorToken = async function () {
  const processorToken = await callMyServer("/server/processor_token");
  showOutput(
    `Here's your token: ${JSON.stringify(
      processorToken
    )}. Go share this with your payment processor!`
  );
};

const getAccountStatus = async function () {
  const accountData = await callMyServer("/server/get_account_status");
  showOutput(JSON.stringify(accountData));
};

const refreshUserStatus = async function () {
  const updatedData = await callMyServer("/server/get_user_info");
  displayAuthDetails(updatedData.auth_status, updatedData.micros_ready);
};

const displayAuthDetails = function (authStatus, microsReady) {
  document.querySelector(
    "#authDetails"
  ).textContent = `Your auth status is ${authStatus}`;
  const moreDetails = document.querySelector("#moreDetails");
  switch (authStatus) {
    case "verified":
      moreDetails.textContent =
        "You can fetch auth numbers and processor tokens!";
      enableSection("#authConnected");
      break;
    case "pending_automatic_verification":
      moreDetails.textContent =
        "Check back in 24 hours! Or just click the 'I'm feeling impatient' button!";
      enableSection("#automatedMicros");
      break;
    case "automatically_verified":
    case "manually_verified":
      moreDetails.textContent =
        "You have been verified. Thanks for your patience.";
      enableSection("#authConnected");
      break;
    case "verification_expired":
    case "verification_failed":
      moreDetails.textContent =
        "You account failed to verify. You'll need to connect again";
      break;
    case "pending_manual_verification":
      moreDetails.textContent = microsReady
        ? "It looks like your deposits are ready! Try verifying your account now."
        : "Come back in 24 hours! Or just pretend 24 hours have passed";
      enableSection("#sameDayMicros");
      break;
  }
};

const refreshAuth = async function () {
  await callMyServer("/server/refresh_auth_status", true);
  await refreshUserStatus();
};

const forceAutoDeposits = async function () {
  await callMyServer("/server/sandbox_force_auto_deposits", true);
  showOutput(
    "If you have webhooks working, your account should now be available. If not, please hit the 'Refresh auth status' button"
  );
  setTimeout(refreshUserStatus, 3000);
};

const getAuthInfo = async function () {
  const authData = await callMyServer("/server/auth");
  showOutput(JSON.stringify(authData));
};

const verifyMicros = async function () {
  await startMicroVerification();
};

const postPendingMicros = async function () {
  const { newPostedMicros } = await callMyServer(
    "/server/post_pending_micros",
    true
  );
  showOutput(
    `I told sandbox to post ${newPostedMicros}  new deposits. ${
      newPostedMicros > 0
        ? "Try clicking the 'Check for posted deposits' button now."
        : ""
    }`
  );
  // If you have the webhook working, this should complete the loop and
  // update your status without your needing to check the other button
  setTimeout(refreshUserStatus, 3000);
};

const checkForMicros = async function () {
  const { postedMicros } = await callMyServer("server/check_for_posted_micros");
  showOutput(
    `I think I found ${postedMicros} deposits that have posted. ${
      postedMicros > 0
        ? "You should be able to verify your deposits now."
        : "Check back later!"
    }`
  );
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
