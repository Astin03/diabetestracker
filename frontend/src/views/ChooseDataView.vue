<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useAlert } from '../composables/useAlert';
import AppLogo from '../components/common/AppLogo.vue';

const router = useRouter();
const auth = useAuthStore();
const alert = useAlert();

onMounted(async () => {
  if (!auth.user) await auth.fetchProfile();
  await auth.loadCareData();
});

function selectOwn() {
  auth.confirmOwnData();
  router.push('/');
}

function selectPatient(patient) {
  auth.confirmPatientData(patient);
  router.push('/');
}

async function acceptAndOpen(invite) {
  try {
    await auth.acceptInvite(invite.id);
    await auth.fetchViewablePatients();
    const patient = auth.viewablePatients.find((p) => p.id === invite.patientId);
    if (patient) {
      selectPatient(patient);
      return;
    }
    alert.success('Invite accepted', 'You can now monitor their data.');
  } catch (e) {
    alert.error(e.response?.data?.error || 'Failed to accept invite');
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-astin-900 to-slate-900">
    <div class="w-full max-w-lg card p-8">
      <div class="text-center mb-8">
        <AppLogo size="lg" centered class="mb-4" />
        <h1 class="text-xl font-bold">Choose what to view</h1>
        <p class="text-slate-500 text-sm mt-2">
          Hi {{ auth.user?.fullName }} — open your own profile or a family member you monitor.
        </p>
      </div>

      <div v-if="auth.pendingInvites.length" class="mb-6 rounded-2xl border border-astin-200 bg-astin-50 dark:border-astin-500/30 dark:bg-astin-500/10 p-4 space-y-3">
        <p class="text-sm font-semibold text-astin-800 dark:text-astin-200">Pending invitations</p>
        <div
          v-for="invite in auth.pendingInvites"
          :key="invite.id"
          class="flex items-center justify-between gap-3"
        >
          <p class="text-sm">{{ invite.patientName }} invited you to view their data</p>
          <button type="button" class="btn-primary text-sm py-2 px-3 shrink-0" @click="acceptAndOpen(invite)">
            Accept
          </button>
        </div>
      </div>

      <div class="space-y-3">
        <button
          type="button"
          class="w-full p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-astin-500 hover:bg-astin-50 dark:hover:bg-astin-900/20 text-left transition flex items-center gap-4"
          @click="selectOwn"
        >
          <div class="w-12 h-12 rounded-xl bg-astin-100 dark:bg-astin-500/20 flex items-center justify-center text-astin-600 shrink-0">
            <i class="ph-duotone ph-user text-2xl"></i>
          </div>
          <div>
            <p class="font-bold">My own data</p>
            <p class="text-sm text-slate-500">Your personal account (if you track yourself)</p>
          </div>
          <i class="ph ph-caret-right ml-auto text-slate-400"></i>
        </button>

        <button
          v-for="patient in auth.viewablePatients"
          :key="patient.id"
          type="button"
          class="w-full p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left transition flex items-center gap-4"
          @click="selectPatient(patient)"
        >
          <div class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 shrink-0">
            <i class="ph-duotone ph-heartbeat text-2xl"></i>
          </div>
          <div>
            <p class="font-bold">{{ patient.fullName }}</p>
            <p class="text-sm text-slate-500">View their glucose &amp; medications (read-only)</p>
          </div>
          <i class="ph ph-caret-right ml-auto text-slate-400"></i>
        </button>
      </div>

      <p v-if="!auth.viewablePatients.length && !auth.pendingInvites.length" class="text-center text-sm text-slate-500 mt-6">
        No family members linked yet. Ask them to invite you from their Settings, or continue with your own data.
      </p>
    </div>
  </div>
</template>
