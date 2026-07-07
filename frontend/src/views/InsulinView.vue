<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';
import { INSULIN_TYPES, MEALS, insulinMeta, mealLabel } from '../utils/insulin';
import { useAlert } from '../composables/useAlert';
import { format, parseISO } from 'date-fns';
import PaginationBar from '../components/common/PaginationBar.vue';

const alert = useAlert();
const logs = ref([]);
const todayTotals = ref(null);
const todayByMeal = ref(null);
const deletingId = ref(null);
const loading = ref(false);
const listLoading = ref(false);
const page = ref(1);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });

const now = new Date();
const form = ref({
  insulinType: 'apidra',
  meal: 'breakfast',
  units: '',
  recordedDate: format(now, 'yyyy-MM-dd'),
  recordedTime: format(now, 'HH:mm'),
});

const dateLabel = computed(() => {
  try {
    return format(parseISO(form.value.recordedDate), 'MMMM d, yyyy');
  } catch {
    return '';
  }
});

const timeLabel = computed(() => {
  try {
    const d = parseISO(`${form.value.recordedDate}T${form.value.recordedTime}`);
    return format(d, 'h:mm a');
  } catch {
    return '';
  }
});

function recordedAtIso() {
  return `${form.value.recordedDate}T${form.value.recordedTime}`;
}

function formatLogDateTime(iso) {
  try {
    const s = String(iso).includes('T') ? iso : iso.replace(' ', 'T');
    return format(parseISO(s), 'MMMM dd, yyyy – h:mm a');
  } catch {
    return iso;
  }
}

const today = format(new Date(), 'yyyy-MM-dd');

async function loadSummary() {
  const { data } = await api.get('/insulin/summary', { params: { from: today, to: today } });
  todayTotals.value = data.totals;
  todayByMeal.value = data.byMeal;
}

async function loadLogs() {
  listLoading.value = true;
  try {
    const { data } = await api.get('/insulin', { params: { page: page.value, limit: 10 } });
    logs.value = data.logs;
    pagination.value = data.pagination;
    if (page.value > data.pagination.totalPages && data.pagination.totalPages > 0) {
      page.value = data.pagination.totalPages;
      return loadLogs();
    }
  } finally {
    listLoading.value = false;
  }
}

async function load() {
  await Promise.all([loadSummary(), loadLogs()]);
}

function onPageChange(p) {
  page.value = p;
  loadLogs();
}

async function submit() {
  loading.value = true;
  try {
    const { data } = await api.post('/insulin', {
      insulinType: form.value.insulinType,
      meal: form.value.meal,
      units: parseFloat(form.value.units),
      recordedAt: recordedAtIso(),
    });
    alert.insulin(data.log);
    form.value.units = '';
    page.value = 1;
    await load();
  } catch (e) {
    alert.error(e.response?.data?.error || 'Failed to save');
  } finally {
    loading.value = false;
  }
}

async function removeLog(log) {
  const ok = window.confirm(
    `Delete this dose?\n\n${insulinMeta(log.insulinType).label} — ${mealLabel(log.meal)} — ${log.units} units\n${formatLogDateTime(log.recordedAt)}`
  );
  if (!ok) return;
  deletingId.value = log.id;
  try {
    await api.delete(`/insulin/${log.id}`);
    alert.success('Deleted', 'Insulin dose removed.');
    await load();
  } catch (e) {
    alert.error(e.response?.data?.error || 'Failed to delete');
  } finally {
    deletingId.value = null;
  }
}

function mealUnits(type, meal) {
  return todayByMeal.value?.[type]?.[meal]?.units ?? 0;
}

onMounted(load);
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <div>
      <h1 class="text-2xl font-bold">Insulin log</h1>
      <p class="text-sm text-slate-500 mt-1">Apidra & Lantus by breakfast, lunch, and dinner</p>
    </div>

    <div class="card overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h2 class="font-semibold text-sm">Today&apos;s units by meal</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-100 dark:bg-slate-800">
              <th class="px-4 py-2 text-left font-medium">Insulin</th>
              <th v-for="m in MEALS" :key="m.value" class="px-4 py-2 text-center font-medium">
                <i :class="m.icon" class="mr-1" />{{ m.label }}
              </th>
              <th class="px-4 py-2 text-center font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="t in INSULIN_TYPES"
              :key="t.value"
              class="border-t border-slate-200 dark:border-slate-700"
            >
              <td class="px-4 py-3 font-medium" :class="t.color.split(' ')[2]">{{ t.label }}</td>
              <td
                v-for="m in MEALS"
                :key="m.value"
                class="px-4 py-3 text-center"
              >
                <span v-if="mealUnits(t.value, m.value)" class="font-bold text-lg">{{ mealUnits(t.value, m.value) }}</span>
                <span v-else class="text-slate-300 dark:text-slate-600">—</span>
              </td>
              <td class="px-4 py-3 text-center font-bold">
                {{ todayTotals?.[t.value]?.units ?? 0 }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <form class="card p-6 space-y-4" @submit.prevent="submit">
      <h2 class="font-semibold">Log dose</h2>

      <div>
        <label class="text-sm text-slate-500">Meal</label>
        <div class="grid grid-cols-3 gap-2 mt-2">
          <button
            v-for="m in MEALS"
            :key="m.value"
            type="button"
            class="py-3 rounded-xl border-2 font-medium text-sm transition flex flex-col items-center gap-1"
            :class="form.meal === m.value
              ? 'border-astin-600 bg-astin-50 dark:bg-astin-900/30 text-astin-800 dark:text-astin-200'
              : 'border-slate-200 dark:border-slate-700'"
            @click="form.meal = m.value"
          >
            <i :class="m.icon" class="text-xl" />
            {{ m.label }}
          </button>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="text-sm text-slate-500">Insulin</label>
          <div class="flex gap-2 mt-2">
            <button
              v-for="t in INSULIN_TYPES"
              :key="t.value"
              type="button"
              class="flex-1 py-3 rounded-xl border-2 font-medium text-sm transition"
              :class="form.insulinType === t.value
                ? 'border-astin-600 bg-astin-50 dark:bg-astin-900/30 text-astin-800 dark:text-astin-200'
                : 'border-slate-200 dark:border-slate-700'"
              @click="form.insulinType = t.value"
            >
              {{ t.label }}
            </button>
          </div>
        </div>
        <div>
          <label class="text-sm text-slate-500">Units</label>
          <input
            v-model="form.units"
            type="number"
            step="0.5"
            min="0.5"
            max="200"
            required
            class="input-field mt-1 text-2xl font-bold"
            placeholder="e.g. 8"
          />
        </div>
        <div>
          <label class="text-sm text-slate-500">Date</label>
          <div class="relative mt-1">
            <div class="input-field flex items-center min-h-[2.75rem] font-medium">
              {{ dateLabel }}
            </div>
            <input
              v-model="form.recordedDate"
              type="date"
              required
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              :aria-label="dateLabel"
            />
          </div>
        </div>
        <div>
          <label class="text-sm text-slate-500">Time</label>
          <div class="relative mt-1">
            <div class="input-field flex items-center min-h-[2.75rem] font-medium">
              {{ timeLabel }}
            </div>
            <input
              v-model="form.recordedTime"
              type="time"
              required
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              :aria-label="timeLabel"
            />
          </div>
        </div>
      </div>
      <button type="submit" class="btn-primary" :disabled="loading">
        {{ loading ? 'Saving...' : `Save ${insulinMeta(form.insulinType).label} — ${mealLabel(form.meal)}` }}
      </button>
    </form>

    <section class="card p-6">
      <h2 class="font-semibold mb-4">Recent doses</h2>
      <div v-if="listLoading" class="skeleton h-24 rounded-xl" />
      <p v-else-if="!logs.length" class="text-sm text-slate-500">No insulin logged yet.</p>
      <ul v-else class="space-y-3">
        <li
          v-for="log in logs"
          :key="log.id"
          class="flex items-center gap-3 p-4 rounded-xl border"
          :class="insulinMeta(log.insulinType).color"
        >
          <div class="flex-1 min-w-0">
            <p class="text-xl font-bold">
              {{ log.units }} <span class="text-sm font-normal">units</span>
            </p>
            <p class="text-sm font-medium">
              {{ insulinMeta(log.insulinType).label }}
              <span class="opacity-60">·</span>
              {{ mealLabel(log.meal) }}
            </p>
          </div>
          <div class="text-right shrink-0 text-sm opacity-80">
            {{ formatLogDateTime(log.recordedAt) }}
          </div>
          <button
            type="button"
            class="shrink-0 p-2 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            :disabled="deletingId === log.id"
            title="Delete dose"
            @click="removeLog(log)"
          >
            <i v-if="deletingId === log.id" class="ph ph-spinner text-xl animate-spin" />
            <i v-else class="ph ph-trash text-xl" />
          </button>
        </li>
      </ul>
      <PaginationBar
        v-if="!listLoading && pagination.totalPages > 1"
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :loading="listLoading"
        @update:page="onPageChange"
      />
    </section>
  </div>
</template>
