<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '../services/api';
import { categoryColor } from '../utils/glucose';
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns';

const MEAL_COLUMNS = [
  {
    group: 'Breakfast',
    theme: 'orange',
    cols: [
      { type: 'pre_breakfast', label: 'Pre-meal' },
      { type: 'post_breakfast_2h', label: '2 hours' },
    ],
  },
  {
    group: 'Lunch',
    theme: 'emerald',
    cols: [
      { type: 'pre_lunch', label: 'Pre-meal' },
      { type: 'post_lunch_2h', label: '2 hours' },
    ],
  },
  {
    group: 'Dinner',
    theme: 'indigo',
    cols: [
      { type: 'pre_dinner', label: 'Pre-meal' },
      { type: 'post_dinner_2h', label: '2 hours' },
    ],
  },
];

function getHeaderClass(theme, isSub = false) {
  if (theme === 'orange') return isSub ? 'bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700/80' : 'bg-orange-300 dark:bg-orange-800/60 text-orange-900 dark:text-orange-100 border-orange-400/80 dark:border-orange-700';
  if (theme === 'emerald') return isSub ? 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/80' : 'bg-emerald-300 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100 border-emerald-400/80 dark:border-emerald-700';
  if (theme === 'indigo') return isSub ? 'bg-indigo-200 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700/80' : 'bg-indigo-300 dark:bg-indigo-800/60 text-indigo-900 dark:text-indigo-100 border-indigo-400/80 dark:border-indigo-700';
  return '';
}

function getColClass(theme) {
  if (theme === 'orange') return 'bg-orange-50/80 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800/60';
  if (theme === 'emerald') return 'bg-emerald-50/80 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/60';
  if (theme === 'indigo') return 'bg-indigo-50/80 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/60';
  return '';
}

const days = ref(7);
const loading = ref(true);
const logsByDate = ref({});

const dateFrom = computed(() => format(subDays(new Date(), days.value - 1), 'yyyy-MM-dd'));
const dateTo = computed(() => format(new Date(), 'yyyy-MM-dd'));

const sortedDates = computed(() => {
  const end = new Date();
  const start = subDays(end, days.value - 1);
  return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'));
});

const printSubtitle = computed(() => {
  const start = format(parseISO(dateFrom.value), 'MMM d, yyyy');
  const end = format(new Date(), 'MMM d, yyyy');
  return `${start} – ${end} · ${days.value} days`;
});

function cellLog(date, type) {
  return logsByDate.value[date]?.[type] ?? null;
}

function isLatestRow(idx) {
  return idx === sortedDates.value.length - 1;
}

function formatTime(iso) {
  try {
    return format(parseISO(iso.replace(' ', 'T')), 'HH:mm');
  } catch {
    return '';
  }
}

function printTable() {
  window.print();
}

async function load() {
  loading.value = true;
  try {
    const { data } = await api.get('/glucose', {
      params: { from: dateFrom.value, limit: 500 },
    });
    const map = {};
    for (const log of data.logs) {
      const date = log.recordedAt.slice(0, 10);
      if (!map[date]) map[date] = {};
      const prev = map[date][log.readingType];
      if (!prev || new Date(log.recordedAt) > new Date(prev.recordedAt)) {
        map[date][log.readingType] = log;
      }
    }
    logsByDate.value = map;
  } finally {
    loading.value = false;
  }
}

watch(days, load);
onMounted(load);
</script>

<template>
  <div class="meal-table-page space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5 no-print">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
          <i class="ph-duotone ph-table text-3xl"></i>
        </div>
        <div>
          <h1 class="text-3xl md:text-4xl font-bold tracking-tight">Meal glucose table</h1>
          <p class="text-slate-500 font-medium mt-1">Pre-meal and 2-hour readings by day</p>
        </div>
      </div>
      <div class="flex items-center gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
        <label class="text-sm text-slate-500 hidden sm:block font-medium">Show</label>
        <select v-model.number="days" class="input-field py-2.5 w-full sm:w-auto text-sm font-medium px-4">
          <option :value="7">7 days</option>
          <option :value="14">14 days</option>
          <option :value="30">30 days</option>
        </select>
        <button type="button" class="btn-secondary text-sm flex items-center justify-center gap-2 flex-1 sm:flex-none" @click="printTable">
          <i class="ph-duotone ph-printer text-lg" />
          Print
        </button>
        <RouterLink to="/glucose" class="btn-primary text-sm flex items-center justify-center gap-2 flex-1 sm:flex-none whitespace-nowrap"><i class="ph-bold ph-plus text-lg"></i> Log reading</RouterLink>
      </div>
    </div>

    <div v-if="loading" class="card p-8 no-print">
      <div class="skeleton h-64" />
    </div>

    <template v-else>
      <!-- Print header (only when printing) -->
      <div class="print-only print-header">
        <h1 class="text-xl font-bold">Astin Diabetes System</h1>
        <h2 class="text-lg font-semibold mt-1">Meal Glucose Table</h2>
        <p class="text-sm text-slate-600">{{ printSubtitle }}</p>
        <p class="text-xs text-slate-500 mt-1">Printed {{ format(new Date(), 'MMM d, yyyy h:mm a') }}</p>
      </div>

      <!-- Mobile cards (screen only) -->
      <div class="md:hidden no-print space-y-4">
        <div
          v-for="(date, idx) in sortedDates.slice().reverse()"
          :key="'m-' + date"
          class="card p-5 space-y-4 transition-all"
          :class="idx === 0 ? 'ring-2 ring-astin-500/30 bg-astin-50/50 dark:bg-astin-900/10 shadow-md' : ''"
        >
          <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <span class="font-bold text-lg">{{ format(parseISO(date), 'MMM d') }}</span>
            <span class="text-sm font-medium text-slate-500">{{ format(parseISO(date), 'EEEE') }}</span>
          </div>
          <div class="space-y-4">
            <div v-for="g in MEAL_COLUMNS" :key="g.group" class="grid grid-cols-3 items-center gap-2">
              <span class="text-sm font-bold text-slate-600 dark:text-slate-400">{{ g.group }}</span>
              <div v-for="col in g.cols" :key="col.type" class="flex flex-col items-center">
                <span class="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{{ col.label }}</span>
                <template v-if="cellLog(date, col.type)">
                  <div
                    class="inline-flex flex-col items-center justify-center w-full px-1 py-1 rounded border font-semibold cell-value"
                    :class="categoryColor(cellLog(date, col.type).category)"
                  >
                    <span class="text-sm">{{ cellLog(date, col.type).value }}</span>
                  </div>
                </template>
                <span v-else class="text-slate-300">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table: desktop + print -->
      <div id="meal-table-print" class="meal-table-print-area screen-table card overflow-hidden p-0 border-0 shadow-lg">
        <div class="overflow-x-auto rounded-[1.25rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <table class="meal-table w-full text-sm text-left border-separate border-spacing-0">
            <thead>
              <tr>
                <th rowspan="2" class="px-4 py-3 font-bold bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 min-w-[100px] text-slate-800 dark:text-slate-200 shadow-sm">
                  Date
                </th>
                <th
                  v-for="g in MEAL_COLUMNS"
                  :key="g.group"
                  colspan="2"
                  class="px-3 py-2.5 text-center font-bold"
                  :class="getHeaderClass(g.theme, false)"
                >
                  {{ g.group }}
                </th>
              </tr>
              <tr>
                <template v-for="g in MEAL_COLUMNS" :key="g.group + '-sub'">
                  <th
                    v-for="col in g.cols"
                    :key="col.type"
                    class="px-2 py-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                    :class="getHeaderClass(g.theme, true)"
                  >
                    {{ col.label }}
                  </th>
                </template>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(date, idx) in sortedDates"
                :key="date"
                class="transition-colors"
                :class="isLatestRow(idx) ? 'bg-astin-50/50 dark:bg-astin-900/20' : 'bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/30'"
              >
                <td class="px-4 py-3 font-medium border-slate-200 dark:border-slate-700/80">
                  <span class="block text-slate-900 dark:text-slate-100">{{ format(parseISO(date), 'MMM d') }}</span>
                  <span class="text-xs text-slate-500">{{ format(parseISO(date), 'EEE') }}</span>
                </td>
                <template v-for="g in MEAL_COLUMNS" :key="date + g.group">
                  <td
                    v-for="col in g.cols"
                    :key="col.type"
                    class="px-2 py-3 text-center transition-colors"
                    :class="getColClass(g.theme)"
                  >
                    <template v-if="cellLog(date, col.type)">
                      <div
                        class="cell-value inline-flex flex-col items-center justify-center min-w-[56px] px-2 py-1.5 rounded-xl border shadow-sm font-bold transition-transform hover:scale-105 cursor-default"
                        :class="categoryColor(cellLog(date, col.type).category)"
                      >
                        <span class="text-base leading-none">{{ cellLog(date, col.type).value }}</span>
                        <span class="text-[9px] font-semibold opacity-70 mt-1">{{ formatTime(cellLog(date, col.type).recordedAt) }}</span>
                      </div>
                    </template>
                    <span v-else class="text-slate-300 dark:text-slate-600">—</span>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="print-legend flex flex-wrap gap-4 text-xs text-slate-500">
        <span class="flex items-center gap-1.5"><span class="legend-dot bg-emerald-500" /> Normal</span>
        <span class="flex items-center gap-1.5"><span class="legend-dot bg-red-500" /> Low</span>
        <span class="flex items-center gap-1.5"><span class="legend-dot bg-orange-500" /> High</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.print-only {
  display: none;
}

.screen-table {
  display: none;
}

@media (min-width: 768px) {
  .screen-table {
    display: block;
  }
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  display: inline-block;
}

/* Fix for table corner clipping with borders */
.meal-table th,
.meal-table td {
  border-bottom-width: 1px;
  border-right-width: 1px;
}
.meal-table tr:last-child td {
  border-bottom-width: 0;
}
.meal-table th:last-child,
.meal-table td:last-child {
  border-right-width: 0;
}

@media print {
  .print-only {
    display: block !important;
  }

  .no-print {
    display: none !important;
  }

  .screen-table {
    display: block !important;
    overflow: visible !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
  }

  .meal-table-print-area {
    overflow: visible !important;
  }

  .meal-table {
    width: 100% !important;
    font-size: 11px !important;
    border-collapse: collapse !important;
    border-spacing: 0 !important;
  }

  .meal-table th,
  .meal-table td {
    border: 1px solid #cbd5e1 !important;
    padding: 6px 8px !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .cell-value {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    box-shadow: none !important;
    border: none !important;
  }

  .print-header {
    margin-bottom: 12px;
    text-align: center;
  }

  .print-legend {
    margin-top: 12px;
    justify-content: center;
  }
}
</style>
