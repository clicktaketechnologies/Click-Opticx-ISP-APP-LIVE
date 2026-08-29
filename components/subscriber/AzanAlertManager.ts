export interface PrayerAlertSettings {
  enabled: boolean;
  individual: Record<string, boolean>;
  sound: 'default' | 'short' | 'silent';
}

class AzanAlertManager {
  // SAFE: audio is lazily created on first play, never in constructor
  private audio: any = null;
  private lastAlertedPrayer: string | null = null;

  private sounds = {
    default: 'https://download.quranicaudio.com/ahmed_al_nufais/azan/azan1.mp3',
    short: 'https://www.islamcan.com/audio/azan/azan2.mp3'
  };

  async playAzan(type: 'default' | 'short' | 'silent') {
    if (type === 'silent') return;

    try {
      if (this.audio) {
        this.audio.pause();
        this.audio = null;
      }
      // Safe guard: Audio may not be constructable in all PWA/iframe contexts
      if (typeof Audio === 'undefined') return;
      this.audio = new Audio(this.sounds[type]);
      await this.audio.play();
    } catch (e) {
      console.warn("[AzanManager] Audio playback blocked by browser security policy.", e);
    }
  }

  stopAzan() {
    try {
      if (this.audio) {
        this.audio.pause();
        this.audio = null;
      }
    } catch (e) {
      // Silently ignore
    }
  }

  async checkAndTrigger(prayers: Record<string, string>, settings: PrayerAlertSettings) {
    if (!settings.enabled) return;

    const now = new Date();
    const currentTimeStr = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });

    for (const [name, time] of Object.entries(prayers)) {
      if (settings.individual[name] && time === currentTimeStr && this.lastAlertedPrayer !== name) {
        this.lastAlertedPrayer = name;
        this.triggerNotification(name);
        await this.playAzan(settings.sound);


        // Reset after a minute to allow next day
        setTimeout(() => {
          this.lastAlertedPrayer = null;
        }, 61000);
      }
    }
  }

  private triggerNotification(prayerName: string) {
    try {
      // Guard: Notification API is not available in all environments
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      // Use ServiceWorker notification if available (avoids Illegal constructor in PWA standalone)
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(`Time for ${prayerName}`, {
            body: `It's time for the ${prayerName} prayer.`,
            icon: '/favicon.ico'
          });
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('[AzanManager] Notification blocked by browser security policy.', e);
    }
  }

  async requestPermission() {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) return false;
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      return false;
    }
  }
}

// SAFE: Lazy singleton — only instantiated when first accessed, never at module evaluation
let _azanManagerInstance: AzanAlertManager | null = null;

export const azanManager = new Proxy({} as AzanAlertManager, {
  get(_target, prop) {
    if (!_azanManagerInstance) {
      _azanManagerInstance = new AzanAlertManager();
    }
    const value = (_azanManagerInstance as any)[prop];
    return typeof value === 'function' ? value.bind(_azanManagerInstance) : value;
  }
});
