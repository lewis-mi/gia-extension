const CARD_ID = "gia-break-card";

function removeCard() {
  document.getElementById(CARD_ID)?.remove();
}

function injectStylesheet() {
  if (document.getElementById("gia-card-css")) return;
  const href = chrome.runtime.getURL("styles/card.css");
  const link = Object.assign(document.createElement("link"), {
    id: "gia-card-css",
    rel: "stylesheet",
    href
  });
  document.documentElement.appendChild(link);
}

function showCard() {
  removeCard();
  injectStylesheet();

  fetch(chrome.runtime.getURL("ui/reminder.html"))
    .then((r) => r.text())
    .then((html) => {
      const wrapper = document.createElement("div");
      wrapper.id = CARD_ID;
      wrapper.innerHTML = html;
      document.documentElement.appendChild(wrapper);

      const root = wrapper.querySelector(".gia-card");
      root?.classList.add("enter");

      // auto-dismiss after 20s
      setTimeout(() => {
        root?.classList.add("exit");
        setTimeout(removeCard, 320);
      }, 20000);
    })
    .catch(console.error);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "GIA_SHOW_BREAK") showCard();
});
