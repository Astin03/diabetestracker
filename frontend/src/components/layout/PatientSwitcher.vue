<script setup>
import { useAuthStore } from '../../stores/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

function openChooser() {
  auth.openDataChooser();
  router.push('/choose-data');
}
</script>

<template>
  <div
    v-if="auth.isViewingOther"
    class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
  >
    <div class="flex items-center gap-2 text-sm font-medium">
      <i class="ph-duotone ph-eye text-xl"></i>
      Viewing <strong>{{ auth.viewingPatient?.fullName }}</strong>'s data (read-only)
    </div>
    <button type="button" class="btn-secondary text-sm py-2 px-3" @click="openChooser">
      Switch
    </button>
  </div>

  <div
    v-else-if="auth.isGuardian"
    class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
  >
    <div class="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
      <i class="ph-duotone ph-user text-xl text-astin-600"></i>
      Viewing <strong>your own data</strong>
    </div>
    <button type="button" class="btn-secondary text-sm py-2 px-3" @click="openChooser">
      Switch to family member
    </button>
  </div>
</template>
