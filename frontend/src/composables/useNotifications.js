import { onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

export function useNotifications() {
  const auth = useAuthStore();
  let interval;

  async function checkReminders() {
    if (!auth.user?.browserNotifications) return;
    if (Notification.permission !== 'granted') return;
    try {
      const { data } = await api.get('/reminders/pending');
      for (const r of data.reminders || []) {
        new Notification(r.title, { body: r.message || 'Medication reminder' });
        if (auth.user?.soundAlerts) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.value = 0.1;
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }
      }
    } catch {
      /* offline */
    }
  }

  onMounted(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    checkReminders();
    interval = setInterval(checkReminders, 60000);
  });

  onUnmounted(() => clearInterval(interval));
}
