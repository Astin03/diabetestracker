<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import GlucoseChart from '../components/glucose/GlucoseChart.vue';
import { estimateA1C } from '../utils/glucose';
import { useAlert } from '../composables/useAlert';
import { useAuthStore } from '../stores/auth';
import { format } from 'date-fns';

const alert = useAlert();
const auth = useAuthStore();
const data = ref(null);
const loading = ref(true);
const resettingMeds = ref(false);

async function loadDashboard() {
  const { data: d } = await api.get('/dashboard');
  data.value = d;
}

onMounted(async () => {
  try {
    await loadDashboard();
  } finally {
    loading.value = false;
  }
});

async function markTaken(id) {
  await api.post(`/medications/checklist/${id}/taken`);
  await loadDashboard();
}

async function resetTodayMedications() {
  const ok = window.confirm(
    "Reset today's medications?\n\nAll doses for today will be cleared and rebuilt as pending."
  );
  if (!ok) return;
  resettingMeds.value = true;
  try {
    await api.post('/medications/checklist/today/reset');
    await loadDashboard();
    alert.success('Reset', "Today's medications were reset.");
  } catch (e) {
    alert.error(e.response?.data?.error || 'Failed to reset');
  } finally {
    resettingMeds.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-astin-50 dark:bg-astin-500/10 flex items-center justify-center text-astin-600 dark:text-astin-400 shadow-sm shrink-0">
          <i class="ph-duotone ph-squares-four text-3xl"></i>
        </div>
        <div>
          <p class="text-xs sm:text-sm font-bold text-astin-600 dark:text-astin-400 uppercase tracking-widest mb-1">{{ format(new Date(), 'EEEE, MMMM d') }}</p>
          <h1 class="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
        </div>
      </div>
      <RouterLink v-if="auth.canWrite" to="/glucose" class="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 whitespace-nowrap"><i class="ph-bold ph-plus text-lg"></i> Log reading</RouterLink>
    </header>

    <div v-if="loading" class="grid md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="skeleton h-24" />
    </div>

    <template v-else-if="data">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div class="card-gradient p-5 md:p-6 flex flex-col justify-between">
          <div class="flex items-center gap-2 mb-2 opacity-90">
            <i class="ph-duotone ph-drop text-xl"></i>
            <p class="text-sm font-medium">Avg glucose (7d)</p>
          </div>
          <p class="text-4xl font-bold mt-2">{{ data.week.stats.avg ?? '—' }} <span class="text-xl font-medium opacity-80">mg/dL</span></p>
        </div>
        <div class="card p-5 md:p-6 flex flex-col justify-between">
          <div class="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
            <i class="ph-duotone ph-chart-line-up text-xl"></i>
            <p class="text-sm font-medium">Est. A1C</p>
          </div>
          <p class="text-4xl font-bold text-astin-600 dark:text-astin-400 mt-2">{{ estimateA1C(data.week.stats.avg) }}%</p>
        </div>
        <div class="card p-5 md:p-6 flex flex-col justify-between">
          <div class="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
            <i class="ph-duotone ph-chart-donut text-xl"></i>
            <p class="text-sm font-medium">Reading levels (7d)</p>
          </div>
          <div v-if="data.week.breakdown?.total" class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-base font-bold">
            <span class="text-emerald-600 dark:text-emerald-400">{{ data.week.breakdown.normal }} normal</span>
            <span class="text-red-500">{{ data.week.breakdown.low }} low</span>
            <span class="text-orange-500">{{ data.week.breakdown.high }} high</span>
          </div>
          <p v-else class="text-4xl font-bold text-slate-800 dark:text-slate-100 mt-2">—</p>
          <p class="text-xs text-slate-500 mt-2">{{ data.week.breakdown?.total ?? 0 }} readings this week</p>
        </div>
        <div class="card p-5 md:p-6 flex flex-col justify-between">
          <div class="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
            <i class="ph-duotone ph-fire text-orange-500 text-xl"></i>
            <p class="text-sm font-medium">Logging streak</p>
          </div>
          <p class="text-4xl font-bold text-slate-800 dark:text-slate-100 mt-2">{{ data.streakDays }} <span class="text-xl font-medium text-slate-400">days</span></p>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 card p-5 md:p-7">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-astin-50 dark:bg-astin-500/10 flex items-center justify-center text-astin-600 dark:text-astin-400">
              <i class="ph-duotone ph-trend-up text-xl"></i>
            </div>
            <h2 class="text-xl font-bold">Weekly glucose trend</h2>
          </div>
          <GlucoseChart
            :logs="data.week.logs"
            :target-low="data.targetLow"
            :target-high="data.targetHigh"
          />
        </div>
        <div class="card p-5 md:p-7 flex flex-col">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <i class="ph-duotone ph-pill text-xl"></i>
              </div>
              <h2 class="text-xl font-bold">Today's medications</h2>
            </div>
            <button
              v-if="auth.canWrite"
              type="button"
              class="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5"
              :disabled="resettingMeds"
              @click="resetTodayMedications"
            >
              <i :class="resettingMeds ? 'ph ph-spinner animate-spin' : 'ph ph-arrow-counter-clockwise'" />
              Reset
            </button>
          </div>
          <ul v-if="data.medicationChecklist?.length" class="space-y-2">
            <li
              v-for="item in data.medicationChecklist"
              :key="item.id"
              class="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"
            >
              <div>
                <p class="font-medium">{{ item.name }}</p>
                <p class="text-xs text-slate-500">{{ item.scheduledTime }}</p>
              </div>
              <button
                v-if="item.status === 'pending' && auth.canWrite"
                type="button"
                class="btn-primary text-sm py-1.5 px-3"
                @click="markTaken(item.id)"
              >
                Take
              </button>
              <span v-else-if="item.status === 'taken'" class="text-emerald-500 text-sm flex items-center gap-1"><i class="ph-fill ph-check-circle"></i> Taken</span>
              <span v-else class="text-red-500 text-sm">Missed</span>
            </li>
          </ul>
          <p v-else class="text-slate-500 text-sm">No medications scheduled today</p>
          <p v-if="data.missedMedicationCount > 0" class="mt-4 text-sm text-red-500">
            {{ data.missedMedicationCount }} missed this week
          </p>
        </div>
      </div>

      <div class="card p-5 md:p-7">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl bg-astin-50 dark:bg-astin-500/10 flex items-center justify-center text-astin-600 dark:text-astin-400">
            <i class="ph-duotone ph-clock-counter-clockwise text-xl"></i>
          </div>
          <h2 class="text-xl font-bold">Recent readings</h2>
        </div>
        <div class="flex flex-wrap gap-4">
          <div
            v-for="r in data.recentReadings"
            :key="r.id"
            class="px-5 py-4 rounded-[1.25rem] border flex flex-col items-center min-w-[120px] shadow-sm transition-transform hover:-translate-y-1 bg-white dark:bg-slate-900/50"
            :class="r.category === 'hypoglycemia' ? 'border-red-200 dark:border-red-800/60 ring-2 ring-red-500/10'
              : r.category === 'hyperglycemia' ? 'border-orange-200 dark:border-orange-800/60 ring-2 ring-orange-500/10'
              : 'border-emerald-200 dark:border-emerald-800/60 ring-2 ring-emerald-500/10'"
          >
            <i class="ph-duotone text-[2rem] mb-2" :class="r.category === 'hypoglycemia' ? 'ph-warning text-red-500' : r.category === 'hyperglycemia' ? 'ph-warning-octagon text-orange-500' : 'ph-check-circle text-emerald-500'"></i>
            <p class="text-3xl font-bold text-slate-800 dark:text-slate-100 leading-none">{{ r.value }}</p>
            <p class="text-xs font-semibold text-slate-500 mt-2">{{ format(new Date(r.recordedAt), 'MMM d, HH:mm') }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
