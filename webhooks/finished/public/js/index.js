import { initializeLink } from "./connect.js";

let accountNames = {};

export const checkConnectedStatus = async function () {
  const connectedData = await callMyServer("/server/get_user_info");
  if (connectedData.user_status === "connected") {
    document.querySelector("#connectedUI").classList.remove("d-none");
    document.querySelector("#disconnectedUI").classList.add("d-none");
  } else {
    document.querySelector("#disconnectedUI").classList.remove("d-none");
    document.querySelector("#connectedUI").classList.add("d-none");
    initializeLink();
  }
};

const getBalances = async function () {
  const balanceData = await callMyServer("/server/balances");
  const simplifiedData = balanceData.accounts.map((acct) => {
    return {
      account: acct.name ?? "(Unknown)",
      // Yes, making the incorrect assumption these are always in dollars.
      account_mask: acct.mask ?? "",
      current_balance:
        acct.balances.current != null
          ? `$${acct.balances.current.toFixed(2)}`
          : "(Unknown)",
    };
  });
  console.table(simplifiedData);
  displaySimplifiedData(simplifiedData);
};

const createAssetReport = async function () {
  const reportResponse = await callMyServer("/server/create_asset_report");
  displaySimplifiedData([{ asset_report_id: reportResponse.asset_report_id }]);
};

const getTransactions = async function () {
  const transactionData = await callMyServer("/server/transactions");
  const simplifiedData = transactionData.transactions.map((t) => {
    return {
      date: t.date,
      vendor: t.name,
      category: t.category[0],
      amount: `$${t.amount.toFixed(2)}`,
    };
  });
  console.table(simplifiedData);
  displaySimplifiedData(simplifiedData);
};

function displaySimplifiedData(simplifiedData) {
  const output = document.querySelector("#output");
  output.innerHTML = "<ul></ul>";
  simplifiedData.forEach((thingToShow) => {
    const nextItem = document.createElement("li");
    nextItem.textContent = JSON.stringify(thingToShow);
    output.appendChild(nextItem);
  });
}

const fireTestWebhook = async function () {
  await callMyServer("/server/fire_test_webhook", true);
};

const updateWebhook = async function () {
  const newWebhookUrl = document.querySelector("#webhookInput").value;
  if (!newWebhookUrl.startsWith("https://")) {
    console.log("How about a real URL here?");
    return false;
  }
  await callMyServer("/server/update_webhook", true, {
    newUrl: newWebhookUrl,
  });
};

const callMyServer = async function (
  endpoint,
  isPost = false,
  postData = null
) {
  const optionsObj = isPost ? { method: "POST" } : {};
  if (isPost && postData !== null) {
    optionsObj.headers = { "Content-type": "application/json" };
    optionsObj.body = JSON.stringify(postData);
  }
  const response = await fetch(endpoint, optionsObj);
  if (response.status === 500) {
    await handleServerError(response);
    return;
  }
  const data = await response.json();
  console.log(`Result from calling ${endpoint}: ${JSON.stringify(data)}`);
  return data;
};

const handleServerError = async function (responseObject) {
  const error = await responseObject.json();
  console.error("I received an error ", error);
};

document.querySelector("#getBalances").addEventListener("click", getBalances);
document
  .querySelector("#getTransactions")
  .addEventListener("click", getTransactions);
document
  .querySelector("#createAsset")
  .addEventListener("click", createAssetReport);
document
  .querySelector("#simulateWebhook")
  .addEventListener("click", fireTestWebhook);
document
  .querySelector("#updateWebhook")
  .addEventListener("click", updateWebhook);

checkConnectedStatus();
