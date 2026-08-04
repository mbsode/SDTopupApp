// SD Topup Auth Bridge
// Handles native fingerprint login inside the Capacitor app only.
// Does NOT affect normal browser behavior (WebAuthn keeps working as-is).

(function () {
  // Only run this bridge if we're inside the Capacitor native app
  if (!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) {
    return;
  }

  const STORAGE_KEY_USERNAME = 'sd_saved_login';
  const STORAGE_KEY_PASSWORD = 'sd_saved_password';
  const STORAGE_KEY_ENABLED = 'sd_fingerprint_enabled';

  async function isFingerprintEnabled() {
    try {
      const { SecureStoragePlugin } = window.Capacitor.Plugins;
      const result = await SecureStoragePlugin.get({ key: STORAGE_KEY_ENABLED });
      return result && result.value === 'true';
    } catch (e) {
      return false;
    }
  }

  async function saveCredentials(username, password) {
    const { SecureStoragePlugin } = window.Capacitor.Plugins;
    await SecureStoragePlugin.set({ key: STORAGE_KEY_USERNAME, value: username });
    await SecureStoragePlugin.set({ key: STORAGE_KEY_PASSWORD, value: password });
    await SecureStoragePlugin.set({ key: STORAGE_KEY_ENABLED, value: 'true' });
  }

  async function getSavedCredentials() {
    const { SecureStoragePlugin } = window.Capacitor.Plugins;
    const username = await SecureStoragePlugin.get({ key: STORAGE_KEY_USERNAME });
    const password = await SecureStoragePlugin.get({ key: STORAGE_KEY_PASSWORD });
    return {
      username: username ? username.value : null,
      password: password ? password.value : null
    };
  }

  async function clearCredentials() {
    const { SecureStoragePlugin } = window.Capacitor.Plugins;
    try { await SecureStoragePlugin.remove({ key: STORAGE_KEY_USERNAME }); } catch (e) {}
    try { await SecureStoragePlugin.remove({ key: STORAGE_KEY_PASSWORD }); } catch (e) {}
    try { await SecureStoragePlugin.remove({ key: STORAGE_KEY_ENABLED }); } catch (e) {}
  }

  async function nativeFingerprintPrompt(reason) {
    const { BiometricAuth } = window.Capacitor.Plugins;
    await BiometricAuth.authenticate({
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