// SD Topup Auth Bridge
// Handles native fingerprint login inside the Capacitor app only.
// Does NOT affect normal browser behavior (WebAuthn keeps working as-is).

(function () {
  // Only run this bridge if we're inside the Capacitor native app
  if (!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) {
    return;
  }

  // TEMPORARY DEBUG: show which plugins Capacitor can see
  window.SD_DEBUG_PLUGINS = Object.keys(window.Capacitor.Plugins || {});

  // TEMPORARY DEBUG: inspect the BiometricAuthNative plugin object directly
  try {
    const bio = window.Capacitor.Plugins.BiometricAuthNative;
    window.SD_DEBUG_BIO_TYPE = typeof bio;
    window.SD_DEBUG_BIO_KEYS = bio ? Object.keys(bio) : [];
    window.SD_DEBUG_BIO_PROTO = bio ? Object.getOwnPropertyNames(Object.getPrototypeOf(bio)) : [];
  } catch (e) {
    window.SD_DEBUG_BIO_ERROR = e.message;
  }

  const STORAGE_KEY_USERNAME = 'sd_saved_login';
  const STORAGE_KEY_PASSWORD = 'sd_saved_password';
  const STORAGE_KEY_ENABLED = 'sd_fingerprint_enabled';

  async function isFingerprintEnabled() {
    try {
      const { SecureStorage } = window.Capacitor.Plugins;
      const result = await SecureStorage.get({ key: STORAGE_KEY_ENABLED });
      return result && result.value === 'true';
    } catch (e) {
      return false;
    }
  }

  async function saveCredentials(username, password) {
    const { SecureStorage } = window.Capacitor.Plugins;
    await SecureStorage.set({ key: STORAGE_KEY_USERNAME, value: username });
    await SecureStorage.set({ key: STORAGE_KEY_PASSWORD, value: password });
    await SecureStorage.set({ key: STORAGE_KEY_ENABLED, value: 'true' });
  }

  async function getSavedCredentials() {
    const { SecureStorage } = window.Capacitor.Plugins;
    const username = await SecureStorage.get({ key: STORAGE_KEY_USERNAME });
    const password = await SecureStorage.get({ key: STORAGE_KEY_PASSWORD });
    return {
      username: username ? username.value : null,
      password: password ? password.value : null
    };
  }

  async function clearCredentials() {
    const { SecureStorage } = window.Capacitor.Plugins;
    try { await SecureStorage.remove({ key: STORAGE_KEY_USERNAME }); } catch (e) {}
    try { await SecureStorage.remove({ key: STORAGE_KEY_PASSWORD }); } catch (e) {}
    try { await SecureStorage.remove({ key: STORAGE_KEY_ENABLED }); } catch (e) {}
  }

  async function nativeFingerprintPrompt(reason) {
    const { BiometricAuthNative } = window.Capacitor.Plugins;
    await BiometricAuthNative.authenticate({
      reason: reason || 'Confirm your identity',
      cancelTitle: 'Use password instead',
      allowDeviceCredential: false
    });
  }

  // Expose a global SDAuthBridge object for our pages to use
  window.SDAuthBridge = {
    isFingerprintEnabled,
    saveCredentials,
    getSavedCredentials,
    clearCredentials,
    nativeFingerprintPrompt
  };
})();