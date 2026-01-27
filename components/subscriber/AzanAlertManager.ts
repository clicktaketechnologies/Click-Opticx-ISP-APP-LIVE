export interface PrayerAlertSettings {
  enabled: boolean;
  individual: Record<string, boolean>;
  sound: 'default' | 'short' | 'silent';
}

class AzanAlertManager {
  private audio: HTMLAudioElement | null = null;
  private lastAlertedPrayer: string | null = null;

  private sounds = {
    default: 'https://download.quranicaudio.com/ahmed_al_nufais/azan/azan1.mp3',
    short: 'https://www.islamcan.com/audio/azan/azan2.mp3'
  };

  async playAzan(type: 'default' | 'short' | 'silent') {
    if (type === 'silent') return;
    
    if (this.audio) {
      this.audio.pause();
    }

    this.audio = new Audio(this.sounds[type]);
    try {
      await this.audio.play();
    } catch (e) {
      console.warn("Azan playback blocked by browser protocol.", e);
    }
  }

  stopAzan() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
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
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      new Notification(`Time for ${prayerName}`, {
        body: `It's time for the ${prayerName} prayer.`,
        icon: '/favicon.ico'
      });
    }
  }

  async requestPermission() {
    if (!("Notification" in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
}

export const azanManager = new AzanAlertManager();