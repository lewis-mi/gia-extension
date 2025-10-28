// ===== SETTINGS STORAGE MODULE =====
// Handles Chrome Storage API operations for settings and counters

const FIXED_SHORT_MIN = 20; // 20-20-20 cadence (not customizable)

/**
 * Get settings from storage
 * @returns {Promise<object>} Settings object
 */
export async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get("settings");
  return settings;
}

/**
 * Update settings in storage
 * @param {object} patch - Settings object to merge
 * @returns {Promise<object>} Updated settings
 */
export async function setSettings(patch) {
  const settings = await getSettings();
  const next = { ...settings, ...patch };
  await chrome.storage.local.set({ settings: next });
  return next;
}

/**
 * Get counters from storage
 * @returns {Promise<object>} Counters object with elapsedMin
 */
export async function getCounters() {
  const { counters = {} } = await chrome.storage.local.get("counters");
  return { elapsedMin: 0, ...counters };
}

/**
 * Update counters in storage
 * @param {object} patch - Counters object to merge
 * @returns {Promise<object>} Updated counters
 */
export async function setCounters(patch) {
  const counters = await getCounters();
  const next = { ...counters, ...patch };
  await chrome.storage.local.set({ counters: next });
  return next;
}

/**
 * Migrate old settings to new format
 * Handles legacy settings structure
 */
export async function migrateSettings() {
  const s = await getSettings();
  if (s.longEvery && !s.longEveryMinutes) {
    const minutes = Math.max(40, Number(s.longEvery) * FIXED_SHORT_MIN);
    await setSettings({ longEveryMinutes: minutes });
  }
  if (typeof s.longEnabled !== "boolean") await setSettings({ longEnabled: false });
  if (!s.longSecs) await setSettings({ longSecs: 300 }); // 5 min
  if (!s.longEveryMinutes) await setSettings({ longEveryMinutes: 60 }); // 60 min default
}

