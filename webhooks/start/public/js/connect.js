import { checkConnectedStatus } from "./index.js";

let linkTokenData;

export const initializeLink = async function () {
  const linkTokenResponse = await fetch("/server/generate_link_token", {
    method: "POST",
  });
  linkTokenData = await linkTokenResponse.json();
  document.querySelector("#startLink").classList.remove("opacity-50");
  console.log(JSON.stringify(linkTokenData));
};

const startLink = function () {
  if (linkTokenData === undefined) {
    return;
  }
  const handler = Plaid.create({
    token: linkTokenData.link_token,
    onSuccess: async (publicToken, metadata) => {
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
      console.log(`Event ${eventName}`);
    },
  });
  handler.open();
};

async function exchangeToken(publicToken) {
  const tokenExchangeResponse = await fetch("/server/swap_public_token", {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify({ public_token: publicToken }),
  });
  // This is where I'd add our error checking... if our server returned any
  // errors.
  const tokenExchangeData = await tokenExchangeResponse.json();
  console.log("Done exchanging our token");
  await checkConnectedStatus();
}

document.querySelector("#startLink").addEventListener("click", startLink);
