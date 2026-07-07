<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import GlucoseForm from '../components/glucose/GlucoseForm.vue';
import PaginationBar from '../components/common/PaginationBar.vue';
import { categoryColor, categoryLabel, readingLabel } from '../utils/glucose';
import { useAlert } from '../composables/useAlert';
import { useAuthStore } from '../stores/auth';
import { format, parseISO } from 'date-fns';

const alert = useAlert();
const auth = useAuthStore();
const logs = ref([]);
const deletingId = ref(null);
const listLoading = ref(false);
const showForm = ref(false);
const page = ref(1);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });

function categoryBar(category) {
  if (category === 'hypoglycemia') return 'bg-red-500';
  if (category === 'hyperglycemia') return 'bg-orange-500';
  return 'bg-emerald-500';
}

function formatRecordedAt(iso) {
  try {
    const s = String(iso).includes('T') ? iso : iso.replace(' ', 'T');
    return format(parseISO(s), 'MMM d, yyyy · h:mm a');
  } catch {
    return iso;
  }
}

async function load() {
  listLoading.value = true;
  try {
    const { data } = await api.get('/glucose', { params: { page: page.value, limit: 10 } });
    logs.value = data.logs;
    pagination.value = data.pagination;
    if (page.value > data.pagination.totalPages && data.pagination.totalPages > 0) {
      page.value = data.pagination.totalPages;
      return load();
    }
  } finally {
    listLoading.value = false;
  }
}

function onPageChange(p) {
  page.value = p;
  load();
}

async function onSubmit(payload) {
  try {
    const { data } = await api.post('/glucose', payload);
    alert.glucose(data.log);
    showForm.value = false;
    page.value = 1;
    await load();
  } catch (e) {
    alert.error(e.response?.data?.error || 'Failed to save');
  }
}

async function removeLog(log) {
  const ok = window.confirm(
    `Delete this reading?\n\n${log.value} mg/dL — ${readingLabel(log.readingType)}\n${formatRecordedAt(log.recordedAt)}`
  );
  if (!ok) return;

  deletingId.value = log.id;
  try {
    await api.delete(`/glucose/${log.id}`);
    alert.success('Deleted', 'Reading removed successfully.');
    await load();
  } catch (e) {
    alert.error(e.response?.data?.error || 'Failed to delete');
  } finally {
    deletingId.value = null;
  }
}

onMounted(load);
</script>

<template>
  <div class="space-y-6 max-w-5xl">
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-astin-50 dark:bg-astin-500/10 flex items-center justify-center text-astin-600 dark:text-astin-400 shadow-sm shrink-0">
          <i class="ph-duotone ph-drop text-3xl"></i>
        </div>
        <div>
          <h1 class="text-3xl md:text-4xl font-bold tracking-tight">Glucose</h1>
          <p class="text-slate-500 font-medium mt-1">Track and review blood sugar readings</p>
        </div>
      </div>
      <button
        v-if="auth.canWrite && !showForm"
        type="button"
        class="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        @click="showForm = true"
      >
        <i class="ph-bold ph-plus text-lg"></i>
        Log blood sugar
      </button>
    </header>

    <GlucoseForm
      v-if="auth.canWrite && showForm"
      @submit="onSubmit"
      @cancel="showForm = false"
    />

    <section class="card p-0 overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 md:px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/30">
        <div>
          <h2 class="font-bold text-lg">Recent readings</h2>
          <p class="text-sm text-slate-500">{{ pagination.total }} total · page {{ pagination.page }} of {{ pagination.totalPages || 1 }}</p>
        </div>
      </div>

      <div v-if="listLoading" class="p-6">
        <div class="skeleton h-48 rounded-xl" />
      </div>

      <div v-else-if="!logs.length" class="p-10 text-center">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
          <i class="ph-duotone ph-drop text-3xl"></i>
        </div>
        <p class="font-medium text-slate-600 dark:text-slate-300">No readings yet</p>
        <p class="text-sm text-slate-500 mt-1">Log your first blood sugar reading to get started.</p>
        <button
          v-if="auth.canWrite"
          type="button"
          class="btn-primary mt-5 inline-flex items-center gap-2"
          @click="showForm = true"
        >
          <i class="ph-bold ph-plus"></i>
          Log blood sugar
        </button>
      </div>

      <template v-else>
        <!-- Desktop table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <th class="px-6 py-3 font-semibold">Reading</th>
                <th class="px-4 py-3 font-semibold">Type</th>
                <th class="px-4 py-3 font-semibold">Status</th>
                <th class="px-4 py-3 font-semibold">When</th>
                <th v-if="auth.canWrite" class="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="log in logs"
                :key="log.id"
                class="hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <span class="w-1 h-10 rounded-full shrink-0" :class="categoryBar(log.category)" />
                    <div>
                      <p class="text-2xl font-bold leading-none text-slate-900 dark:text-slate-100">
                        {{ log.value }}
                        <span class="text-sm font-medium text-slate-500">mg/dL</span>
                      </p>
                      <p v-if="log.mealNotes" class="text-xs text-slate-500 mt-1 truncate max-w-[200px]">{{ log.mealNotes }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <span class="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs">
                    {{ readingLabel(log.readingType) }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <span
                    class="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border"
                    :class="categoryColor(log.category)"
                  >
                    {{ categoryLabel(log.category) }}
                  </span>
                </td>
                <td class="px-4 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {{ formatRecordedAt(log.recordedAt) }}
                </td>
                <td v-if="auth.canWrite" class="px-6 py-4 text-right">
                  <button
                    type="button"
                    class="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition disabled:opacity-50"
                    :disabled="deletingId === log.id"
                    title="Delete reading"
                    @click="removeLog(log)"
                  >
                    <i v-if="deletingId === log.id" class="ph ph-spinner animate-spin" />
                    <i v-else class="ph ph-trash" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <ul class="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          <li
            v-for="log in logs"
            :key="'m-' + log.id"
            class="flex gap-0"
          >
            <span class="w-1 shrink-0" :class="categoryBar(log.category)" />
            <div class="flex-1 flex items-start gap-3 p-4 min-w-0">
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-baseline gap-2">
                  <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ log.value }}</p>
                  <span class="text-sm text-slate-500">mg/dL</span>
                  <span
                    class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    :class="categoryColor(log.category)"
                  >
                    {{ categoryLabel(log.category) }}
                  </span>
                </div>
                <p class="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">{{ readingLabel(log.readingType) }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ formatRecordedAt(log.recordedAt) }}</p>
                <p v-if="log.mealNotes" class="text-xs text-slate-500 mt-1 italic">{{ log.mealNotes }}</p>
              </div>
              <button
                v-if="auth.canWrite"
                type="button"
                class="shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                :disabled="deletingId === log.id"
                @click="removeLog(log)"
              >
                <i v-if="deletingId === log.id" class="ph ph-spinner animate-spin" />
                <i v-else class="ph ph-trash text-lg" />
              </button>
            </div>
          </li>
        </ul>
      </template>

      <div v-if="!listLoading && pagination.totalPages > 1" class="px-5 py-4 border-t border-slate-100 dark:border-slate-800">
        <PaginationBar
          :page="pagination.page"
          :total-pages="pagination.totalPages"
          :total="pagination.total"
          :loading="listLoading"
          @update:page="onPageChange"
        />
      </div>
    </section>
  </div>
</template>
