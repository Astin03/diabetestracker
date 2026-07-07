<script setup>
import { ref, watch } from 'vue';
import { useAuthStore } from '../../stores/auth';

const DISMISS_KEY = 'astin_notify_dismissed';

const auth = useAuthStore();
const visible = ref(false);

function canPrompt() {
  return (
    auth.isGuardian
    && auth.dataContextChosen
    && localStorage.getItem(DISMISS_KEY) !== '1'
    && typeof Notification !== 'undefined'
    && Notification.permission === 'default'
  );
}

function evaluate() {
  visible.value = canPrompt();
}

watch(
  () => [auth.isGuardian, auth.dataContextChosen, auth.user?.browserNotifications],
  evaluate,
  { immediate: true }
);

async function enableNotifications() {
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    await auth.updateProfile({ browserNotifications: true, notificationsEnabled: true });
  }
  visible.value = false;
}

function dismiss() {
  localStorage.setItem(DISMISS_KEY, '1');
  visible.value = false;
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4"
        role="dialog"
        aria-labelledby="notify-prompt-title"
      >
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <i class="ph-duotone ph-bell-ringing text-2xl" />
          </div>
          <div>
            <h2 id="notify-prompt-title" class="text-lg font-bold">Enable monitoring alerts</h2>
            <p class="text-sm text-slate-500 mt-1 leading-relaxed">
              Get push notifications when your patient logs blood sugar, injects insulin, or takes medication.
            </p>
          </div>
        </div>
        <ul class="text-sm text-slate-600 dark:text-slate-300 space-y-2 pl-1">
          <li class="flex items-center gap-2"><i class="ph-fill ph-drop text-red-400" /> Glucose readings</li>
          <li class="flex items-center gap-2"><i class="ph-fill ph-syringe text-astin-500" /> Insulin injections</li>
          <li class="flex items-center gap-2"><i class="ph-fill ph-pill text-indigo-500" /> Medications taken</li>
        </ul>
        <div class="flex flex-col-reverse sm:flex-row gap-2 pt-1">
          <button type="button" class="btn-secondary flex-1 text-sm" @click="dismiss">Not now</button>
          <button type="button" class="btn-primary flex-1 text-sm" @click="enableNotifications">Allow notifications</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
