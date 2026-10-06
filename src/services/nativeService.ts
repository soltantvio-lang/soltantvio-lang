import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const initializeNativePlugins = async () => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // Configure dark status bar matching Fit Max branding
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#090d16' });
  } catch (e) {
    console.debug('StatusBar setup bypassed in web/pwa mode:', e);
  }

  try {
    // Hide splash screen after initialization
    await SplashScreen.hide();
  } catch (e) {
    console.debug('SplashScreen setup bypassed in web/pwa mode:', e);
  }

  try {
    // Handle Android hardware back button
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        // If at root and not in workout, exit app gracefully
        CapApp.exitApp();
      }
    });
  } catch (e) {
    console.debug('BackButton listener bypassed in web/pwa mode:', e);
  }
};
