/* ─────────────────────────────────────────────────
   Haptic feedback

   Native Capacitor haptics on iOS/Android, Vibration API
   fallback on the mobile web. Every call is fire-and-forget:
   haptics must never delay or break an interaction, so all
   failures (desktop, permissions, unsupported) are swallowed.
───────────────────────────────────────────────── */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = () => Capacitor.isNativePlatform();

function webVibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    /* unsupported — silently skip */
  }
}

/* Light tick — photo change, crossing the swipe threshold. */
export function hapticLight(): void {
  if (isNative()) {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  } else {
    webVibrate(10);
  }
}

/* Medium impact — committing a like/pass. */
export function hapticMedium(): void {
  if (isNative()) {
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
  } else {
    webVibrate(20);
  }
}

/* Success notification — it's a match. */
export function hapticSuccess(): void {
  if (isNative()) {
    Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  } else {
    webVibrate([30, 60, 30]);
  }
}

/* Warning notification — action failed, card restored. */
export function hapticWarning(): void {
  if (isNative()) {
    Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
  } else {
    webVibrate([20, 40, 20]);
  }
}
