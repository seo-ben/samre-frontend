/**
 * Service de Notifications de Bureau (Web Desktop Notifications & Web Audio Chime)
 * Permet à l'administrateur de recevoir des alertes natives comme Google / Chrome
 * sur son écran d'ordinateur (Mac, Windows, Linux).
 */

class DesktopNotificationService {
  constructor() {
    this.audioCtx = null;
  }

  /**
   * Vérifie si le navigateur supporte l'API Notification
   */
  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Retourne l'état actuel de la permission ('granted', 'denied', 'default')
   */
  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Demande à l'utilisateur l'autorisation d'afficher des notifications sur son ordinateur
   */
  async requestPermission() {
    if (!this.isSupported()) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Erreur lors de la demande de permission de notification:', e);
      return Notification.permission;
    }
  }

  /**
   * Vérifie si le son des alertes est activé
   */
  isSoundEnabled() {
    try {
      return localStorage.getItem('samre_admin_notif_sound') !== 'false';
    } catch {
      return true;
    }
  }

  /**
   * Active ou désactive le son des alertes
   */
  setSoundEnabled(enabled) {
    try {
      localStorage.setItem('samre_admin_notif_sound', enabled ? 'true' : 'false');
    } catch (e) {
      // Ignorer
    }
  }

  /**
   * Joue une sonnerie d'alerte subtile et élégante via la Web Audio API (aucun fichier externe requis)
   */
  playChime() {
    if (!this.isSoundEnabled()) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Note 1 : La (880 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2 : Do# aigu (1108.73 Hz) avec léger décalage
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1108.73, now + 0.12);
      gain2.gain.setValueAtTime(0.07, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);

    } catch (err) {
      // Audio bloqué ou non supporté
    }
  }

  /**
   * Déclenche une notification système native sur l'ordinateur
   * @param {Object} params { id, title, body, icon, url, onClick }
   */
  showNotification({ id, title, body, icon, url, onClick }) {
    // 1. Jouer la sonnerie d'alerte
    this.playChime();

    // 2. Si non supporté ou permission non accordée
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return null;
    }

    try {
      const notifTitle = title || 'SAMRE Admin — Alerte en direct';
      const notifOptions = {
        body: body || 'Une nouvelle activité nécessite votre attention.',
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: id ? String(id) : 'samre_alert_' + Date.now(),
        renotify: true,
        silent: false,
        requireInteraction: false,
        data: { url: url || '/dashboard' }
      };

      const notification = new Notification(notifTitle, notifOptions);

      notification.onclick = (event) => {
        event.preventDefault();
        try {
          window.focus();
        } catch (e) {}

        if (typeof onClick === 'function') {
          onClick();
        } else if (url) {
          window.location.href = url;
        }

        notification.close();
      };

      return notification;
    } catch (err) {
      console.warn('Impossible d\'afficher la notification de bureau:', err);
      return null;
    }
  }

  /**
   * Envoie une notification de test sur l'ordinateur de l'admin
   */
  testNotification() {
    return this.showNotification({
      id: 'test_' + Date.now(),
      title: '🔔 SAMRE — Notifications PC Actives !',
      body: 'Félicitations, vous recevrez désormais les alertes administratives en direct sur votre ordinateur.',
      url: '/notifications'
    });
  }
}

export const desktopNotif = new DesktopNotificationService();
export default desktopNotif;
