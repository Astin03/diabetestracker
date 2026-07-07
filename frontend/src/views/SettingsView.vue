<script setup>
import { ref, onMounted, computed } from 'vue';
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

const viewerEmail = ref('');
const viewerName = ref('');
const inviting = ref(false);

const showOwnSettings = computed(() => !auth.isViewingOther);

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
  if (!auth.isGuardian) await auth.fetchViewers();
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

async function inviteViewer() {
  if (!viewerEmail.value.trim()) {
    alert.error('Enter an email address');
    return;
  }
  inviting.value = true;
  try {
    await auth.inviteViewer(viewerEmail.value.trim(), viewerName.value.trim() || undefined);
    viewerEmail.value = '';
    viewerName.value = '';
    alert.success('Invite sent', 'They can accept the invite after registering with that email.');
  } catch (e) {
    alert.error(e.response?.data?.error || 'Failed to send invite');
  } finally {
    inviting.value = false;
  }
}

async function revoke(id) {
  if (!window.confirm('Remove this viewer\'s access?')) return;
  try {
    await auth.revokeViewer(id);
    alert.success('Removed', 'Viewer access revoked.');
  } catch (e) {
    alert.error(e.response?.data?.error || 'Failed to revoke');
  }
}

function statusLabel(status) {
  if (status === 'accepted') return 'Active';
  if (status === 'pending') return 'Pending';
  return status;
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
        <p class="text-slate-500 font-medium mt-1">Preferences, care team & backups</p>
      </div>
    </div>

    <section v-if="showOwnSettings && !auth.isGuardian" class="card p-5 md:p-7">
      <h2 class="text-lg font-bold flex items-center gap-2 mb-2">
        <i class="ph-duotone ph-users-three text-astin-600 text-xl"></i>
        Family & viewers
      </h2>
      <p class="text-sm text-slate-500 mb-4">
        Add relatives (e.g. parents, spouse) who can view your glucose, medications, and logs. They cannot change your data.
        They must <strong>register or log in</strong> with the same email you invite — the app does not email passwords.
      </p>

      <form class="flex flex-col sm:flex-row gap-3 mb-6" @submit.prevent="inviteViewer">
        <input v-model="viewerEmail" type="email" class="input-field flex-1" placeholder="Relative's email" required />
        <input v-model="viewerName" type="text" class="input-field sm:max-w-[10rem]" placeholder="Label (optional)" />
        <button type="submit" class="btn-primary shrink-0" :disabled="inviting">
          {{ inviting ? 'Sending...' : 'Add viewer' }}
        </button>
      </form>

      <p v-if="!auth.viewers.length" class="text-sm text-slate-500">No viewers added yet.</p>
      <ul v-else class="space-y-2">
        <li
          v-for="v in auth.viewers"
          :key="v.id"
          class="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700"
        >
          <div class="min-w-0">
            <p class="font-medium truncate">{{ v.displayName || v.email }}</p>
            <p class="text-xs text-slate-500 truncate">{{ v.email }}</p>
            <p v-if="v.status === 'pending'" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Waiting: they register as a <RouterLink to="/register?type=guardian" class="underline">Guardian</RouterLink> with this email, then accept under Settings → Invitations.
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span
              class="text-xs font-medium px-2 py-0.5 rounded-full"
              :class="v.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'"
            >
              {{ statusLabel(v.status) }}
            </span>
            <button
              type="button"
              class="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
              title="Remove viewer"
              @click="revoke(v.id)"
            >
              <i class="ph ph-trash text-lg"></i>
            </button>
          </div>
        </li>
      </ul>
    </section>

    <form v-if="showOwnSettings && !auth.isViewingOther" class="card p-5 md:p-7 space-y-6" @submit.prevent="saveSettings">
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

    <section v-if="showOwnSettings" class="card p-5 md:p-7">
      <h2 class="text-lg font-bold flex items-center gap-2 mb-4"><i class="ph-duotone ph-database text-slate-500 text-xl"></i> Data & Backups</h2>
      <div class="grid sm:grid-cols-2 gap-4">
        <button type="button" class="btn-secondary w-full flex items-center justify-center gap-2" @click="backupData"><i class="ph-duotone ph-download-simple text-lg"></i> Backup (JSON)</button>
        <label class="btn-secondary w-full block text-center cursor-pointer flex items-center justify-center gap-2">
          <i class="ph-duotone ph-upload-simple text-lg"></i> Restore
          <input type="file" accept=".json" class="hidden" @change="onRestore" />
        </label>
      </div>
    </section>

    <p v-if="showOwnSettings" class="text-sm text-slate-500">
      Manage doctor and lab visits on the
      <RouterLink to="/appointments" class="text-astin-600 hover:underline">Appointments</RouterLink>
      page.
    </p>
  </div>
</template>
