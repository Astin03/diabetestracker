<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import api from '../services/api';
import GlucoseChart from '../components/glucose/GlucoseChart.vue';
import PaginationBar from '../components/common/PaginationBar.vue';
import { estimateA1C, readingLabel, categoryColor } from '../utils/glucose';
import { format, subDays } from 'date-fns';
import { exportCsv, exportPdf } from '../utils/export';

const period = ref('day');
const search = ref('');
const dateFrom = ref(format(new Date(), 'yyyy-MM-dd'));
const summary = ref(null);
const loading = ref(true);
const timelinePage = ref(1);
const timelinePagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });

const periodLabel = computed(() => {
  if (period.value === 'week') return 'Last 7 days';
  if (period.value === 'month') return 'Last 30 days';
  return format(new Date(dateFrom.value), 'MMM d, yyyy');
});

function getRange() {
  const today = format(new Date(), 'yyyy-MM-dd');
  if (period.value === 'week') {
    return { from: format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: today };
  }
  if (period.value === 'month') {
    return { from: format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: today };
  }
  return { from: dateFrom.value, to: dateFrom.value };
}

async function load() {
  loading.value = true;
  try {
    const { from, to } = getRange();
    const { data } = await api.get('/glucose/summary', {
      params: {
        from,
        to,
        search: search.value || undefined,
        timelinePage: timelinePage.value,
        timelineLimit: 10,
      },
    });
    summary.value = data;
    timelinePagination.value = data.timelinePagination;
    if (timelinePage.value > data.timelinePagination.totalPages && data.timelinePagination.totalPages > 0) {
      timelinePage.value = data.timelinePagination.totalPages;
      return load();
    }
  } finally {
    loading.value = false;
  }
}

function onTimelinePageChange(p) {
  timelinePage.value = p;
  load();
}

watch(period, () => {
  timelinePage.value = 1;
  load();
});
watch(dateFrom, () => {
  if (period.value === 'day') {
    timelinePage.value = 1;
    load();
  }
});

function setPeriod(p) {
  period.value = p;
  timelinePage.value = 1;
  if (p === 'day') {
    dateFrom.value = format(new Date(), 'yyyy-MM-dd');
  }
  load();
}

let searchTimer;
function onSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    timelinePage.value = 1;
    load();
  }, 300);
}

onMounted(load);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-astin-50 dark:bg-astin-500/10 flex items-center justify-center text-astin-600 dark:text-astin-400 shadow-sm shrink-0">
          <i class="ph-duotone ph-book-open text-3xl"></i>
        </div>
        <div>
          <h1 class="text-3xl md:text-4xl font-bold tracking-tight">Diabetes logbook</h1>
          <p class="text-slate-500 font-medium mt-1">{{ periodLabel }}</p>
        </div>
      </div>
      <div class="flex gap-3 w-full sm:w-auto">
        <button type="button" class="btn-secondary text-sm flex items-center justify-center gap-2 flex-1 sm:flex-none" @click="exportCsv()"><i class="ph-duotone ph-file-csv text-lg"></i> CSV</button>
        <button type="button" class="btn-secondary text-sm flex items-center justify-center gap-2 flex-1 sm:flex-none" @click="exportPdf(summary?.logs || [])"><i class="ph-duotone ph-file-pdf text-lg"></i> PDF</button>
      </div>
    </div>

    <div class="flex flex-wrap gap-2 items-center">
      <button
        v-for="p in ['day', 'week', 'month']"
        :key="p"
        type="button"
        class="px-4 py-2 rounded-xl text-sm capitalize transition"
        :class="period === p ? 'bg-astin-600 text-white' : 'btn-secondary'"
        @click="setPeriod(p)"
      >
        {{ p }}
      </button>
      <input
        v-if="period === 'day'"
        v-model="dateFrom"
        type="date"
        class="input-field w-full sm:w-auto"
        @change="load"
      />
      <input
        v-model="search"
        type="search"
        placeholder="Search notes..."
        class="input-field w-full sm:w-48"
        @input="onSearch"
      />
    </div>

    <div v-if="loading" class="skeleton h-64 rounded-2xl" />

    <template v-else-if="summary">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div class="card p-5 md:p-6 flex flex-col justify-between">
          <div class="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
            <i class="ph-duotone ph-math-operations text-xl"></i>
            <p class="text-sm font-medium">Average</p>
          </div>
          <p class="text-3xl font-bold mt-1 text-slate-800 dark:text-slate-100">{{ summary.stats.avg ?? '—' }}</p>
        </div>
        <div class="card p-5 md:p-6 flex flex-col justify-between">
          <div class="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
            <i class="ph-duotone ph-arrows-out-line-vertical text-xl"></i>
            <p class="text-sm font-medium">Low / High</p>
          </div>
          <p class="text-3xl font-bold mt-1 text-slate-800 dark:text-slate-100">{{ summary.stats.min ?? '—' }} / {{ summary.stats.max ?? '—' }}</p>
        </div>
        <div class="card p-5 md:p-6 flex flex-col justify-between">
          <div class="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
            <i class="ph-duotone ph-chart-line-up text-xl"></i>
            <p class="text-sm font-medium">Est. A1C</p>
          </div>
          <p class="text-3xl font-bold mt-1 text-astin-600 dark:text-astin-400">{{ estimateA1C(summary.stats.avg) }}%</p>
        </div>
        <div class="card p-5 md:p-6 flex flex-col justify-between">
          <div class="flex items-center gap-2 mb-2 text-slate-500 dark:text-slate-400">
            <i class="ph-duotone ph-clock text-xl"></i>
            <p class="text-sm font-medium">Time in range</p>
          </div>
          <p class="text-3xl font-bold mt-1 text-slate-800 dark:text-slate-100">{{ summary.timeInRange?.percent ?? 0 }}%</p>
        </div>
      </div>

      <div v-if="!summary.logs?.length" class="card p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
        <div class="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4">
          <i class="ph-duotone ph-chart-line text-4xl opacity-50" />
        </div>
        <p class="text-lg font-medium">No readings in this period.</p>
        <RouterLink to="/glucose" class="btn-primary mt-6 inline-flex items-center gap-2"><i class="ph-duotone ph-plus-circle text-lg"></i> Log glucose</RouterLink>
      </div>

      <template v-else>
        <div class="card p-5 md:p-7">
          <GlucoseChart
            :logs="summary.logs"
            :target-low="summary.targetLow"
            :target-high="summary.targetHigh"
            :height="320"
          />
        </div>

        <div class="card p-5 md:p-7">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <i class="ph-duotone ph-clock-counter-clockwise text-xl"></i>
            </div>
            <h2 class="text-xl font-bold">Timeline ({{ timelinePagination.total }})</h2>
          </div>
          <ul class="space-y-4 border-l-2 border-astin-200 dark:border-astin-800 ml-3 pl-6">
            <li v-for="log in summary.timeline" :key="log.id" class="relative">
              <span class="absolute -left-[29px] w-3 h-3 rounded-full bg-astin-500" />
              <div class="flex justify-between items-start gap-4">
                <div>
                  <p class="font-bold text-lg">{{ log.value }} mg/dL</p>
                  <p class="text-sm text-slate-500">{{ readingLabel(log.readingType) }}</p>
                  <p v-if="log.notes" class="text-sm mt-1">{{ log.notes }}</p>
                </div>
                <span class="text-xs px-2 py-1 rounded-full border shrink-0" :class="categoryColor(log.category)">
                  {{ format(new Date(log.recordedAt), 'MMM d, HH:mm') }}
                </span>
              </div>
            </li>
          </ul>
          <PaginationBar
            v-if="timelinePagination.totalPages > 1"
            :page="timelinePagination.page"
            :total-pages="timelinePagination.totalPages"
            :total="timelinePagination.total"
            :loading="loading"
            @update:page="onTimelinePageChange"
          />
        </div>
      </template>
    </template>
  </div>
</template>
