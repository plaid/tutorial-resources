import { startLink } from "./link.js";
import {
  createNewUser,
  refreshSignInStatus,
  signIn,
  signOut,
} from "./signin.js";
import {
  callMyServer,
  currencyAmount,
  humanReadableCategory,
  showSelector,
} from "./utils.js";

export const refreshConnectedBanks = async () => {
  const banksMsg = document.querySelector("#banksMsg");
  const bankData = await callMyServer("/server/banks/list");
  if (bankData == null || bankData.length === 0) {
    banksMsg.textContent = "You aren't connected to any banks yet. 🙁";
  } else if (bankData.length === 1) {
    banksMsg.textContent = `You're connected to ${
      bankData[0].bank_name ?? "unknown"
    }`;
  } else {
    // The English language is weird.
    banksMsg.textContent =
      `You're connected to ` +
      bankData
        .map((e, idx) => {
          return (
            (idx == bankData.length - 1 && bankData.length > 1 ? "and " : "") +
            (e.bank_name ?? "(Unknown)")
          );
        })
        .join(bankData.length !== 2 ? ", " : " ");
  }
  document.querySelector("#connectToBank").textContent =
    bankData != null && bankData.length > 0
      ? "Connect another bank!"
      : "Connect a bank!";

  // Fill out our "Remove this bank" drop-down
  const bankOptions = bankData.map(
    (bank) => `<option value=${bank.id}>${bank.bank_name}</option>`
  );

  const bankSelect = document.querySelector("#deactivateBankSelect");
  bankSelect.innerHTML =
    `<option>--Pick one--</option>` + bankOptions.join("\n");
};

const showTransactionData = (txnData) => {
  const tableRows = txnData.map((txnObj) => {
    return `<tr>
    <td>${txnObj.date}</td>
    <td>${txnObj.name}</td>
    <td>${humanReadableCategory(txnObj.category)}</td>
    <td class="text-end">${currencyAmount(
      txnObj.amount,
      txnObj.currency_code
    )}</td>
    <td>${txnObj.bank_name}<br/>${txnObj.account_name}</td>
    </tr>`;
  });
  // WARNING: Not really safe without some proper sanitization
  document.querySelector("#transactionTable").innerHTML = tableRows.join("\n");
};

const connectToBank = async () => {
  await startLink(() => {
    refreshConnectedBanks();
  });
};

export const clientRefresh = async () => {
  const txnData = await callMyServer("/server/transactions/list?maxCount=50");
  showTransactionData(txnData);
};

const serverRefresh = async () => {
  await callMyServer("/server/transactions/sync", true);
};

const generateWebhook = async () => {
  await callMyServer("/server/debug/generate_webhook", true);
};

const deactivateBank = async () => {
  const itemId = document.querySelector("#deactivateBankSelect").value;
  if (itemId != null && itemId !== "") {
    await callMyServer("/server/banks/deactivate", true, { itemId: itemId });
    await refreshConnectedBanks();
  }
};

// Connect selectors to functions
const selectorsAndFunctions = {
  "#createAccount": createNewUser,
  "#signIn": signIn,
  "#signOut": signOut,
  "#connectToBank": connectToBank,
  "#serverRefresh": serverRefresh,
  "#clientRefresh": clientRefresh,
  "#generateWebhook": generateWebhook,
  "#deactivateBank": deactivateBank,
};

Object.entries(selectorsAndFunctions).forEach(([sel, fun]) => {
  if (document.querySelector(sel) == null) {
    console.warn(`Hmm... couldn't find ${sel}`);
  } else {
    document.querySelector(sel)?.addEventListener("click", fun);
  }
});

await refreshSignInStatus();
