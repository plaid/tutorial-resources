import { callMyServer } from "./utils.js";

/**
 * Start Link and define the callbacks we will call if a user completes the
 * flow or exits early
 */
export const startLink = async function (customSuccessHandler) {
  const linkTokenData = await fetchLinkToken();
  if (linkTokenData === undefined) {
    return;
  }
  const handler = Plaid.create({
    token: linkTokenData.link_token,
    onSuccess: async (publicToken, metadata) => {
      console.log(`Finished with Link! ${JSON.stringify(metadata)}`);
      await exchangePublicToken(publicToken);
      customSuccessHandler();
    },
    onExit: async (err, metadata) => {
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

/**
 * To start Link, we need to fetch  a Link token from the user. We'll save this
 * as our `linkTokenData` variable defined at the beginning of our file.
 */
const fetchLinkToken = async function () {
  const linkTokenData = await callMyServer(
    "/server/tokens/generate_link_token",
    true
  );
  return linkTokenData;
};

/**
 * Exchange our Link token data for an access token
 */
const exchangePublicToken = async (publicToken) => {
  await callMyServer("/server/tokens/exchange_public_token", true, {
    publicToken: publicToken,
  });
  console.log("Done exchanging our token.");
};
