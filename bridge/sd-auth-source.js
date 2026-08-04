import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

(function () {
  if (!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) {
    return;
  }

  const STORAGE_KEY_USERNAME = 'sd_saved_login';
  const STORAGE_KEY_PASSWORD = 'sd_saved_password';
  const STORAGE_KEY_ENABLED = 'sd_fingerprint_enabled';

  const STORAGE_KEY_PURCHASE_PIN = 'sd_purchase_pin';
  const STORAGE_KEY_PURCHASE_ENABLED = 'sd_purchase_fingerprint_enabled';

  async function isFingerprintEnabled() {
    try {
      const value = await SecureStorage.getItem(STORAGE_KEY_ENABLED);
      return value === 'true';
    } catch (e) {
      return false;
    }
  }

  async function saveCredentials(username, password) {
    await SecureStorage.setItem(STORAGE_KEY_USERNAME, username);
    await SecureStorage.setItem(STORAGE_KEY_PASSWORD, password);
    await SecureStorage.setItem(STORAGE_KEY_ENABLED, 'true');
  }

  async function getSavedCredentials() {
    const username = await SecureStorage.getItem(STORAGE_KEY_USERNAME);
    const password = await SecureStorage.getItem(STORAGE_KEY_PASSWORD);
    return { username, password };
  }

  async function clearCredentials() {
    try { await SecureStorage.removeItem(STORAGE_KEY_USERNAME); } catch (e) {}
    try { await SecureStorage.removeItem(STORAGE_KEY_PASSWORD); } catch (e) {}
    try { await SecureStorage.removeItem(STORAGE_KEY_ENABLED); } catch (e) {}
  }

  async function isPurchaseFingerprintEnabled() {
    try {
      const value = await SecureStorage.getItem(STORAGE_KEY_PURCHASE_ENABLED);
      return value === 'true';
    } catch (e) {
      return false;
    }
  }

  async function enablePurchaseFingerprint(pin) {
    await SecureStorage.setItem(STORAGE_KEY_PURCHASE_PIN, pin);
    await SecureStorage.setItem(STORAGE_KEY_PURCHASE_ENABLED, 'true');
  }

  async function getStoredPurchasePin() {
    try {
      return await SecureStorage.getItem(STORAGE_KEY_PURCHASE_PIN);
    } catch (e) {
      return null;
    }
  }

  async function clearPurchasePin() {
    try { await SecureStorage.removeItem(STORAGE_KEY_PURCHASE_PIN); } catch (e) {}
    try { await SecureStorage.removeItem(STORAGE_KEY_PURCHASE_ENABLED); } catch (e) {}
  }

  async function nativeFingerprintPrompt(reason) {
    await BiometricAuth.authenticate({
      reason: reason || 'Confirm your identity',
      cancelTitle: 'Use password instead',
      allowDeviceCredential: false
    });
  }

  window.SDAuthBridge = {
    isFingerprintEnabled,
    saveCredentials,
    getSavedCredentials,
    clearCredentials,
    isPurchaseFingerprintEnabled,
    enablePurchaseFingerprint,
    getStoredPurchasePin,
    clearPurchasePin,
    nativeFingerprintPrompt
  };
})();