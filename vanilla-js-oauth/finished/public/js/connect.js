let linkTokenData;

const initializeLink = async function () {
  const linkTokenResponse = await fetch(`/api/create_link_token`);
  linkTokenData = await linkTokenResponse.json();
  localStorage.setItem("linkTokenData", JSON.stringify(linkTokenData));
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
        `I'm all done. Error: ${JSON.stringify(err)} Metadata: ${JSON.stringify(
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
  const tokenExchangeResponse = await fetch(`/api/exchange_public_token`, {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify({ public_token: publicToken }),
  });
  // This is where I'd add our error checking... if our server returned any
  // errors.
  const tokenExchangeData = await tokenExchangeResponse.json();
  console.log("Done exchanging our token");
  window.location.href = "index.html";
}

document.querySelector("#startLink").addEventListener("click", startLink);

initializeLink();
