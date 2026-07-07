<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '../services/api';
import { categoryColor, categoryPrintClass } from '../utils/glucose';
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns';
import MealGlucoseTable from '../components/glucose/MealGlucoseTable.vue';

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

const days = ref(14);
const loading = ref(true);
const logsByDate = ref({});

const todayDate = computed(() => format(new Date(), 'yyyy-MM-dd'));
const todayLabel = computed(() => format(new Date(), 'EEEE, MMMM d'));

const dateFrom = computed(() => format(subDays(new Date(), days.value - 1), 'yyyy-MM-dd'));

const sortedDates = computed(() => {
  const end = new Date();
  const start = subDays(end, days.value - 1);
  return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'));
});

const historyDates = computed(() => sortedDates.value.filter((d) => d !== todayDate.value));

const printSubtitle = computed(() => {
  const start = format(parseISO(dateFrom.value), 'MMM d, yyyy');
  const end = format(new Date(), 'MMM d, yyyy');
  return `${start} – ${end} · ${days.value} days`;
});

function cellLog(date, type) {
  return logsByDate.value[date]?.[type] ?? null;
}

function printTable() {
  window.print();
}

async function load() {
  loading.value = true;
  try {
    const { data } = await api.get('/glucose', {
      params: { from: dateFrom.value, limit: Math.min(days.value * 8, 1000) },
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
          <option :value="60">60 days</option>
          <option :value="90">90 days</option>
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
      <div class="print-only print-header">
        <h2 class="text-sm font-bold">Astin Diabetes System</h2>
        <p class="text-xs mt-0.5">Meal Glucose Table</p>
        <p class="text-[10px] text-slate-600">{{ printSubtitle }}</p>
        <p class="text-[9px] text-slate-500 mt-0.5">Printed {{ format(new Date(), 'MMM d, yyyy h:mm a') }}</p>
      </div>

      <!-- Today (printable) -->
      <section class="card overflow-hidden p-0 border-astin-200/60 dark:border-astin-500/30 shadow-md print-table-block">
        <div class="px-5 py-3 md:px-6 bg-astin-50 dark:bg-astin-900/20 border-b border-astin-100 dark:border-astin-800/50 flex items-center justify-between gap-3 no-print">
          <div>
            <h2 class="font-bold text-lg text-astin-800 dark:text-astin-200">Today</h2>
            <p class="text-sm text-slate-500">{{ todayLabel }}</p>
          </div>
          <span class="text-xs font-semibold uppercase tracking-wider text-astin-600 dark:text-astin-400 bg-white/80 dark:bg-slate-900/50 px-2.5 py-1 rounded-full">Live</span>
        </div>

        <!-- Mobile today -->
        <div class="md:hidden p-5 space-y-4">
          <div v-for="g in MEAL_COLUMNS" :key="'today-m-' + g.group" class="grid grid-cols-3 items-center gap-2">
            <span class="text-sm font-bold text-slate-600 dark:text-slate-400">{{ g.group }}</span>
            <div v-for="col in g.cols" :key="col.type" class="flex flex-col items-center">
              <span class="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{{ col.label }}</span>
              <template v-if="cellLog(todayDate, col.type)">
                <div
                  class="inline-flex items-center justify-center w-full px-1 py-1.5 rounded-lg border font-bold text-sm cell-value"
                  :class="[
                    categoryColor(cellLog(todayDate, col.type).category),
                    categoryPrintClass(cellLog(todayDate, col.type).category),
                  ]"
                >
                  {{ cellLog(todayDate, col.type).value }}
                </div>
              </template>
              <span v-else class="text-slate-300 text-sm">—</span>
            </div>
          </div>
        </div>

        <!-- Desktop today -->
        <p class="print-section-title hidden print:block px-4 pt-2">Today — {{ todayLabel }}</p>
        <div class="hidden md:block p-4 print:block print:p-0 print:px-2">
          <MealGlucoseTable
            :dates="[todayDate]"
            :logs-by-date="logsByDate"
            :meal-columns="MEAL_COLUMNS"
            :highlight-latest="false"
            compact
          />
        </div>
      </section>

      <!-- Mobile history cards -->
      <div class="md:hidden no-print space-y-4">
        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">Previous days</h2>
        <div
          v-for="date in [...historyDates].reverse()"
          :key="'m-' + date"
          class="card p-5 space-y-4"
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
                    class="inline-flex items-center justify-center w-full px-1 py-1 rounded-lg border font-semibold text-sm cell-value"
                    :class="categoryColor(cellLog(date, col.type).category)"
                  >
                    {{ cellLog(date, col.type).value }}
                  </div>
                </template>
                <span v-else class="text-slate-300 text-sm">—</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- History table -->
      <section v-if="historyDates.length" id="meal-table-print" class="meal-table-print-area screen-table card overflow-hidden p-0 border-0 shadow-lg print-table-block">
        <div class="px-5 py-3 md:px-6 bg-slate-50/80 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 no-print">
          <h2 class="font-bold text-lg">Previous days</h2>
          <p class="text-sm text-slate-500">{{ historyDates.length }} days</p>
        </div>
        <p class="print-section-title hidden print:block px-4 pt-2">Previous days ({{ historyDates.length }})</p>
        <div class="p-4 print:p-0 print:px-2">
          <MealGlucoseTable
            :dates="historyDates"
            :logs-by-date="logsByDate"
            :meal-columns="MEAL_COLUMNS"
            :highlight-latest="false"
            compact
          />
        </div>
      </section>

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

.print-section-title {
  display: none;
}

@media print {
  .print-only {
    display: block !important;
  }

  .no-print {
    display: none !important;
  }

  .meal-table-page {
    background: #fff !important;
    color: #000 !important;
    padding: 0 !important;
  }

  .meal-table-page * {
    color: #000 !important;
    box-shadow: none !important;
  }

  .screen-table,
  .print-table-block,
  .hidden.md\:block {
    display: block !important;
  }

  .md\:hidden {
    display: none !important;
  }

  .screen-table,
  .print-table-block {
    overflow: visible !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    background: #fff !important;
    padding: 0 !important;
    margin-bottom: 10px !important;
  }

  .meal-table-print-area {
    overflow: visible !important;
  }

  .meal-table {
    width: 100% !important;
    font-size: 8px !important;
    border-collapse: collapse !important;
  }

  .meal-table th,
  .meal-table td {
    border: 1px solid #cbd5e1 !important;
    padding: 3px 4px !important;
    background: #fff !important;
    color: #000 !important;
  }

  .meal-table th {
    background: #f1f5f9 !important;
    font-size: 7px !important;
    font-weight: 700 !important;
  }

  .cell-value {
    background: #fff !important;
    color: #000 !important;
    box-shadow: none !important;
    font-size: 8px !important;
    padding: 2px 4px !important;
    min-width: 0 !important;
    border-radius: 2px !important;
  }

  .cell-value.cell-cat-low {
    border: 1.5px solid #ef4444 !important;
  }

  .cell-value.cell-cat-high {
    border: 1.5px solid #f97316 !important;
  }

  .cell-value.cell-cat-normal {
    border: 1.5px solid #22c55e !important;
  }

  .print-header {
    margin-bottom: 8px;
    text-align: center;
    color: #000 !important;
  }

  .print-header h2,
  .print-header p {
    color: #000 !important;
  }

  .print-section-title {
    display: block !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    margin: 8px 0 4px !important;
    color: #000 !important;
  }

  .print-legend {
    margin-top: 8px;
    justify-content: center;
    font-size: 8px !important;
    color: #475569 !important;
  }
}
</style>
