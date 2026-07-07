<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import GlucoseForm from '../components/glucose/GlucoseForm.vue';
import PaginationBar from '../components/common/PaginationBar.vue';
import { categoryColor, categoryLabel, readingLabel } from '../utils/glucose';
import { useAlert } from '../composables/useAlert';
import { format } from 'date-fns';

const alert = useAlert();
const logs = ref([]);
const deletingId = ref(null);
const listLoading = ref(false);
const page = ref(1);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });

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
    page.value = 1;
    await load();
  } catch (e) {
    alert.error(e.response?.data?.error || 'Failed to save');
  }
}

async function removeLog(log) {
  const ok = window.confirm(
    `Delete this reading?\n\n${log.value} mg/dL — ${readingLabel(log.readingType)}\n${format(new Date(log.recordedAt), 'MMM d, HH:mm')}`
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
  <div class="space-y-6 max-w-4xl">
    <h1 class="text-2xl font-bold">Log glucose</h1>
    <GlucoseForm @submit="onSubmit" />
    <section class="card p-6">
      <h2 class="font-semibold mb-4">Recent readings</h2>
      <div v-if="listLoading" class="skeleton h-24 rounded-xl" />
      <p v-else-if="!logs.length" class="text-sm text-slate-500">No readings yet.</p>
      <ul v-else class="space-y-3">
        <li
          v-for="log in logs"
          :key="log.id"
          class="flex items-center gap-3 p-4 rounded-xl border"
          :class="categoryColor(log.category)"
        >
          <div class="flex-1 min-w-0">
            <p class="text-2xl font-bold">{{ log.value }} <span class="text-sm font-normal">mg/dL</span></p>
            <p class="text-sm opacity-80">{{ readingLabel(log.readingType) }}</p>
          </div>
          <div class="text-right shrink-0">
            <span class="text-xs font-medium px-2 py-0.5 rounded-full border">{{ categoryLabel(log.category) }}</span>
            <p class="text-xs mt-1 opacity-70">{{ format(new Date(log.recordedAt), 'MMM d, HH:mm') }}</p>
          </div>
          <button
            type="button"
            class="shrink-0 p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition disabled:opacity-50"
            :disabled="deletingId === log.id"
            title="Delete reading"
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
