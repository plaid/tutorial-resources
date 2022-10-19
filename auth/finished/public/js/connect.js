import { checkConnectedStatus } from "./client.js";
import { callMyServer } from "./utilities.js";

let linkTokenData;

export const initializeLink = async function () {
  linkTokenData = await callMyServer("/server/generate_link_token", true);
  document.querySelector("#startLink").classList.remove("opacity-50");
};

export const startMicroVerification = async function () {
  linkTokenData = await callMyServer(
    "/server/generate_link_token_for_micros",
    true
  );
  startLink();
};

const startLink = function () {
  if (linkTokenData === undefined) {
    return;
  }
  const handler = Plaid.create({
    token: linkTokenData.link_token,
    onSuccess: async (publicToken, metadata) => {
      console.log(`ONSUCCESS: Metadata ${JSON.stringify(metadata)}`);
      console.log(
        `I have a public token: ${publicToken} I should exchange this`
      );
      await exchangeToken(publicToken);
    },
    onExit: (err, metadata) => {
      console.log(
        `Exited early. Error: ${JSON.stringify(err)} Metadata: ${JSON.stringify(
          metadata
        )}`
      );
    },
    onEvent: (eventName, metadata) => {
      console.log(`Event ${eventName}, Metadata: ${JSON.stringify(metadata)}`);
    },
  });
  handler.open();
};

async function exchangeToken(publicToken) {
  await callMyServer("/server/swap_public_token", true, {
    public_token: publicToken,
  });
  console.log("Done exchanging our token. I'll re-fetch our status");
  await checkConnectedStatus();
}

document.querySelector("#startLink").addEventListener("click", () => {
  startLink(false);
});
