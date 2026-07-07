import { onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

const SHOWN_IDS_KEY = 'astin_shown_notify_ids';
const LAST_CHECK_KEY = 'astin_last_notify_check';

function loadShownIds() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SHOWN_IDS_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function saveShownIds(ids) {
  sessionStorage.setItem(SHOWN_IDS_KEY, JSON.stringify([...ids].slice(-100)));
}

function playAlertSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.1;
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    /* audio unavailable */
  }
}

export function useNotifications() {
  const auth = useAuthStore();
  let interval;
  const shownIds = loadShownIds();
  let lastCheck = sessionStorage.getItem(LAST_CHECK_KEY);
  let firstCareCheck = !lastCheck;
  if (!lastCheck) lastCheck = new Date().toISOString();

  async function checkReminders() {
    if (!auth.user?.browserNotifications) return;
    if (Notification.permission !== 'granted') return;
    try {
      const { data } = await api.get('/reminders/pending');
      for (const r of data.reminders || []) {
        new Notification(r.title, { body: r.message || 'Medication reminder' });
        if (auth.user?.soundAlerts) playAlertSound();
      }
    } catch {
      /* offline */
    }
  }

  async function checkCareAlerts() {
    if (!auth.isGuardian) return;
    if (!auth.user?.browserNotifications) return;
    if (Notification.permission !== 'granted') return;

    try {
      const params = firstCareCheck ? {} : { since: lastCheck };
      const { data } = await api.get('/notifications', { params });
      const now = new Date().toISOString();
      const items = firstCareCheck
        ? (data.notifications || []).filter((n) => !n.isRead).slice(0, 5)
        : data.notifications || [];
      firstCareCheck = false;

      for (const n of items) {
        if (shownIds.has(n.id) || n.isRead) continue;
        new Notification(n.title, { body: n.message });
        shownIds.add(n.id);
        if (auth.user?.soundAlerts) playAlertSound();
      }

      lastCheck = now;
      sessionStorage.setItem(LAST_CHECK_KEY, now);
      saveShownIds(shownIds);
    } catch {
      /* offline */
    }
  }

  async function poll() {
    await Promise.all([checkReminders(), checkCareAlerts()]);
  }

  onMounted(() => {
    poll();
    interval = setInterval(poll, 30000);
  });

  onUnmounted(() => clearInterval(interval));
}
