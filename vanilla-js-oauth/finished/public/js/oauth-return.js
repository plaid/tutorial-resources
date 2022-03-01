function finishOAuth() {
  const storedTokenData = localStorage.getItem("linkTokenData");
  console.log(`I retrieved ${storedTokenData} from local storage`);
  const linkTokenData = JSON.parse(storedTokenData);

  const handler = Plaid.create({
    token: linkTokenData.link_token,
    receivedRedirectUri: window.location.href,
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
      if (err !== null) {
        document.querySelector("#userMessage").innerHTML =
          "Oh no! We got some kind of error! Please <a href='connect.html'>try again.</a>";
      }
    },
    onEvent: (eventName, metadata) => {
      console.log(`Event ${eventName}`);
    },
  });
  handler.open();
}

// TODO: Remove this duplicate code by putting it into a module or something
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

finishOAuth();
