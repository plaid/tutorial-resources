export const enableSection = function (sectionId) {
  const sectionsToCheck = [
    "#authConnected",
    "#automatedMicros",
    "#sameDayMicros",
  ];
  sectionsToCheck.forEach((sel) => {
    const parentDiv = document.querySelector(sel);
    if (sel === sectionId) {
      parentDiv.classList.remove("opacity-25");
      document.querySelectorAll(sel + " button").forEach((button) => {
        button.disabled = false;
      });
    } else {
      parentDiv.classList.add("opacity-25");
      document.querySelectorAll(sel + " button").forEach((button) => {
        button.disabled = true;
      });
    }
  });
};

export const callMyServer = async function (
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

export const showOutput = function (textToShow) {
  if (textToShow == null) return;
  const output = document.querySelector("#output");
  output.textContent = textToShow;
};

const handleServerError = async function (responseObject) {
  const error = await responseObject.json();
  console.error("I received an error ", error);
  if (error.hasOwnProperty("error_message")) {
    showOutput(`Error: ${error.error_message} -- See console for more`);
  }
};
