/**
 * Capacitor 네이티브 기능 래퍼
 * 웹에서는 no-op, 네이티브 앱에서만 동작
 */

import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

// ── Haptics ──────────────────────────────────────
export async function hapticLight() {
  if (!isNative) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function hapticMedium() {
  if (!isNative) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Medium });
}

export async function hapticHeavy() {
  if (!isNative) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Heavy });
}

// ── Share ────────────────────────────────────────
export async function nativeShare(options: { title: string; text: string; url: string }) {
  if (!isNative) return false;
  try {
    const { Share } = await import('@capacitor/share');
    await Share.share(options);
    return true;
  } catch {
    return false;
  }
}

// ── Status Bar ───────────────────────────────────
export async function setDarkStatusBar() {
  if (!isNative) return;
  const { StatusBar, Style } = await import('@capacitor/status-bar');
  await StatusBar.setStyle({ style: Style.Dark });
  await StatusBar.setBackgroundColor({ color: '#12101a' });
}

// ── Splash Screen ────────────────────────────────
export async function hideSplash() {
  if (!isNative) return;
  const { SplashScreen } = await import('@capacitor/splash-screen');
  await SplashScreen.hide({ fadeOutDuration: 300 });
}

// ── Push Notifications ───────────────────────────
export async function initPushNotifications() {
  if (!isNative) return null;
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return null;

  await PushNotifications.register();

  return new Promise<string | null>((resolve) => {
    PushNotifications.addListener('registration', (token) => {
      resolve(token.value);
    });
    PushNotifications.addListener('registrationError', () => {
      resolve(null);
    });
  });
}

// ── Init (앱 시작 시 1회 호출) ───────────────────
export async function initNative() {
  if (!isNative) return;
  await setDarkStatusBar();
  await hideSplash();
}
