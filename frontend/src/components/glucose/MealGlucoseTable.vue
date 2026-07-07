<script setup>
import { categoryColor, categoryPrintClass } from '../../utils/glucose';
import { format, parseISO } from 'date-fns';

defineProps({
  dates: { type: Array, required: true },
  logsByDate: { type: Object, required: true },
  mealColumns: { type: Array, required: true },
  highlightLatest: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
});

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

function cellLog(logsByDate, date, type) {
  return logsByDate[date]?.[type] ?? null;
}

function isLatestRow(dates, idx) {
  return idx === dates.length - 1;
}
</script>

<template>
  <div class="overflow-x-auto rounded-[1.25rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
    <table class="meal-table w-full text-sm text-left border-separate border-spacing-0">
      <thead>
        <tr>
          <th
            rowspan="2"
            class="px-4 py-3 font-bold bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 min-w-[100px] text-slate-800 dark:text-slate-200 shadow-sm"
            :class="compact ? 'py-2 text-xs' : ''"
          >
            Date
          </th>
          <th
            v-for="g in mealColumns"
            :key="g.group"
            colspan="2"
            class="px-3 py-2.5 text-center font-bold"
            :class="[getHeaderClass(g.theme, false), compact ? 'py-2 text-xs' : '']"
          >
            {{ g.group }}
          </th>
        </tr>
        <tr>
          <template v-for="g in mealColumns" :key="g.group + '-sub'">
            <th
              v-for="col in g.cols"
              :key="col.type"
              class="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider"
              :class="getHeaderClass(g.theme, true)"
            >
              {{ col.label }}
            </th>
          </template>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(date, idx) in dates"
          :key="date"
          class="transition-colors"
          :class="highlightLatest && isLatestRow(dates, idx)
            ? 'bg-astin-50/50 dark:bg-astin-900/20'
            : 'bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/30'"
        >
          <td class="px-4 py-2.5 font-medium border-slate-200 dark:border-slate-700/80">
            <span class="block text-slate-900 dark:text-slate-100" :class="compact ? 'text-sm' : ''">{{ format(parseISO(date), 'MMM d') }}</span>
            <span class="text-[10px] text-slate-500">{{ format(parseISO(date), 'EEE') }}</span>
          </td>
          <template v-for="g in mealColumns" :key="date + g.group">
            <td
              v-for="col in g.cols"
              :key="col.type"
              class="px-2 py-2 text-center transition-colors"
              :class="getColClass(g.theme)"
            >
              <template v-if="cellLog(logsByDate, date, col.type)">
                <div
                  class="cell-value inline-flex items-center justify-center min-w-[44px] px-2 py-1 rounded-lg border font-bold"
                  :class="[
                    categoryColor(cellLog(logsByDate, date, col.type).category),
                    categoryPrintClass(cellLog(logsByDate, date, col.type).category),
                    compact ? 'text-sm' : 'text-base',
                  ]"
                >
                  {{ cellLog(logsByDate, date, col.type).value }}
                </div>
              </template>
              <span v-else class="text-slate-300 dark:text-slate-600 text-sm">—</span>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
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
</style>
