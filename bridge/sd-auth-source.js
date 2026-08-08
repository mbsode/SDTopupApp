import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { PushNotifications } from '@capacitor/push-notifications';
import { Contacts } from '@capacitor-community/contacts';

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

  async function registerPushNotifications() {
    try {
      const permStatus = await PushNotifications.checkPermissions();

      let granted = permStatus.receive === 'granted';

      if (!granted) {
        const requestResult = await PushNotifications.requestPermissions();
        granted = requestResult.receive === 'granted';
      }

      if (!granted) {
        return { status: false, message: 'Notification permission not granted.' };
      }

      return new Promise((resolve) => {
        PushNotifications.addListener('registration', async (token) => {
          try {
            await fetch('/api/save_push_token.php', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: token.value, platform: 'android' })
            });
            resolve({ status: true, token: token.value });
          } catch (err) {
            resolve({ status: false, message: 'Could not save push token.' });
          }
        });

        PushNotifications.addListener('registrationError', (error) => {
          resolve({ status: false, message: error.error || 'Registration failed.' });
        });

        PushNotifications.register();
      });
    } catch (error) {
      return { status: false, message: error.message || 'Push registration failed.' };
    }
  }

  async function pickPhoneContact() {
    try {
      const permStatus = await Contacts.requestPermissions();

      if (permStatus.contacts !== 'granted') {
        return { status: false, message: 'Contacts permission not granted.' };
      }

      const result = await Contacts.pickContact({
        projection: { name: true, phones: true }
      });

      if (!result || !result.contact) {
        return { status: false, message: 'No contact selected.' };
      }

      const phones = result.contact.phones || [];
      if (phones.length === 0) {
        return { status: false, message: 'Selected contact has no phone number.' };
      }

      return {
        status: true,
        phone: phones[0].number || '',
        name: (result.contact.name && result.contact.name.display) || ''
      };
    } catch (error) {
      return { status: false, message: error.message || 'Contact picker was cancelled.' };
    }
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
    nativeFingerprintPrompt,
    registerPushNotifications,
    pickPhoneContact
  };
})();