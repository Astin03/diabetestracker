<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useAlert } from '../composables/useAlert';
import { backupData, restoreData } from '../utils/export';

const auth = useAuthStore();
const alert = useAlert();

const form = ref({
  fullName: '',
  diabetesType: 'type_2',
  targetLow: 70,
  targetHigh: 180,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  notificationsEnabled: true,
  soundAlerts: true,
  browserNotifications: true,
});

onMounted(async () => {
  const u = auth.user || await auth.fetchProfile();
  Object.assign(form.value, {
    fullName: u.fullName,
    diabetesType: u.diabetesType,
    targetLow: u.targetLow,
    targetHigh: u.targetHigh,
    timezone: u.timezone,
    notificationsEnabled: u.notificationsEnabled,
    soundAlerts: u.soundAlerts,
    browserNotifications: u.browserNotifications,
  });
});

async function saveSettings() {
  await auth.updateProfile({ ...form.value });
  alert.success('Settings saved', 'Your profile was updated successfully.');
}

async function onRestore(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    await restoreData(file);
    alert.success('Restored', 'Your backup data was imported.');
  } catch {
    alert.error('Restore failed. Check the file and try again.');
  }
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-2xl bg-astin-50 dark:bg-astin-500/10 flex items-center justify-center text-astin-600 dark:text-astin-400 shadow-sm shrink-0">
        <i class="ph-duotone ph-gear text-3xl"></i>
      </div>
      <div>
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight">Settings</h1>
        <p class="text-slate-500 font-medium mt-1">Preferences and backups</p>
      </div>
    </div>

    <form class="card p-5 md:p-7 space-y-6" @submit.prevent="saveSettings">
      <div>
        <h2 class="text-lg font-bold flex items-center gap-2 mb-4"><i class="ph-duotone ph-user text-astin-600 text-xl"></i> Profile</h2>
        <div class="space-y-4">
          <input v-model="form.fullName" class="input-field" placeholder="Full name" />
      <select v-model="form.diabetesType" class="input-field">
        <option value="type_1">Type 1</option>
        <option value="type_1_5">Type 1.5 (LADA)</option>
        <option value="type_2">Type 2</option>
        <option value="gestational">Gestational</option>
        </select>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-bold flex items-center gap-2 mb-4 pt-2"><i class="ph-duotone ph-target text-orange-500 text-xl"></i> Glucose targets (mg/dL)</h2>
        <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="text-sm text-slate-500">Low threshold</label>
          <input v-model.number="form.targetLow" type="number" class="input-field" />
        </div>
        <div>
          <label class="text-sm text-slate-500">High threshold</label>
          <input v-model.number="form.targetHigh" type="number" class="input-field" />
          </div>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-bold flex items-center gap-2 mb-4 pt-2"><i class="ph-duotone ph-bell-ringing text-indigo-500 text-xl"></i> Notifications</h2>
        <div class="space-y-3">
          <label class="flex items-center gap-3 cursor-pointer">
        <input v-model="form.notificationsEnabled" type="checkbox" />
        Enable notifications
      </label>
      <label class="flex items-center gap-2">
        <input v-model="form.soundAlerts" type="checkbox" />
        Sound alerts
      </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="form.browserNotifications" type="checkbox" class="w-4 h-4 text-astin-600 rounded" />
            <span class="font-medium text-slate-700 dark:text-slate-200">Browser notifications</span>
          </label>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-bold flex items-center gap-2 mb-4 pt-2"><i class="ph-duotone ph-globe-hemisphere-west text-emerald-500 text-xl"></i> Localization</h2>
        <input v-model="form.timezone" class="input-field" placeholder="Timezone" />
      </div>

      <button type="submit" class="btn-primary w-full sm:w-auto">Save settings</button>
    </form>

    <section class="card p-5 md:p-7">
      <h2 class="text-lg font-bold flex items-center gap-2 mb-4"><i class="ph-duotone ph-database text-slate-500 text-xl"></i> Data & Backups</h2>
      <div class="grid sm:grid-cols-2 gap-4">
        <button type="button" class="btn-secondary w-full flex items-center justify-center gap-2" @click="backupData"><i class="ph-duotone ph-download-simple text-lg"></i> Backup (JSON)</button>
        <label class="btn-secondary w-full block text-center cursor-pointer flex items-center justify-center gap-2">
          <i class="ph-duotone ph-upload-simple text-lg"></i> Restore
          <input type="file" accept=".json" class="hidden" @change="onRestore" />
        </label>
      </div>
    </section>

    <p class="text-sm text-slate-500">
      Manage doctor and lab visits on the
      <RouterLink to="/appointments" class="text-astin-600 hover:underline">Appointments</RouterLink>
      page.
    </p>
  </div>
</template>
