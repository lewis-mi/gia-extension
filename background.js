// default interval (20 minutes)
const DEFAULT_INTERVAL_MIN = 20;

async function getSettings() {
  const { intervalMin = DEFAULT_INTERVAL_MIN, audioOn = false } =
    await chrome.storage.local.get(["intervalMin", "audioOn"]);
  return { intervalMin, audioOn };
}

async function createAlarm() {
  const { intervalMin } = await getSettings();
  await chrome.alarms.clear("gia-break");
  chrome.alarms.create("gia-break", { periodInMinutes: Number(intervalMin) });
}

chrome.runtime.onInstalled.addListener(createAlarm);
chrome.runtime.onStartup.addListener(createAlarm);

chrome.storage.onChanged.addListener((changes) => {
  if (changes.intervalMin) createAlarm();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "gia-break") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "GIA_SHOW_BREAK" });
});
