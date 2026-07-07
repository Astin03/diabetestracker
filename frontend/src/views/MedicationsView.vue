<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { useAlert } from '../composables/useAlert';
import { useAuthStore } from '../stores/auth';
import { format } from 'date-fns';
import PaginationBar from '../components/common/PaginationBar.vue';

const alert = useAlert();
const auth = useAuthStore();
const meds = ref([]);
const medPage = ref(1);
const medPagination = ref({ page: 1, limit: 12, total: 0, totalPages: 1 });
const checklist = ref([]);
const showForm = ref(false);
const editingId = ref(null);
const deletingId = ref(null);
const saving = ref(false);
const resettingChecklist = ref(false);

const emptyForm = () => ({
  name: '',
  dosage: '',
  notes: '',
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: '',
  reminderTime: '08:00',
  frequencyType: 'daily',
  frequencyConfig: {},
});

const form = ref(emptyForm());

function timeForInput(value) {
  if (!value) return '08:00';
  const s = String(value);
  return s.length >= 5 ? s.slice(0, 5) : s;
}

async function loadMeds() {
  const { data } = await api.get('/medications', {
    params: { page: medPage.value, limit: 12 },
  });
  meds.value = data.medications;
  medPagination.value = data.pagination;
  if (medPage.value > data.pagination.totalPages && data.pagination.totalPages > 0) {
    medPage.value = data.pagination.totalPages;
    return loadMeds();
  }
}

async function load() {
  const c = await api.get('/medications/checklist/today');
  checklist.value = c.data.checklist;
  await loadMeds();
}

function onMedPageChange(p) {
  medPage.value = p;
  loadMeds();
}

function openAdd() {
  editingId.value = null;
  form.value = emptyForm();
  showForm.value = true;
}

function openEdit(m) {
  editingId.value = m.id;
  form.value = {
    name: m.name,
    dosage: m.dosage || '',
    notes: m.notes || '',
    startDate: m.startDate,
    endDate: m.endDate || '',
    reminderTime: timeForInput(m.reminderTime),
    frequencyType: m.frequencyType,
    frequencyConfig: { ...(m.frequencyConfig || {}) },
  };
  showForm.value = true;
}

function cancelForm() {
  showForm.value = false;
  editingId.value = null;
  form.value = emptyForm();
}

async function saveMed() {
  if (!form.value.name?.trim()) {
    alert.warning('Missing name', 'Medication name is required.');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...form.value,
      name: form.value.name.trim(),
      endDate: form.value.endDate || null,
      frequencyConfig: buildConfig(),
    };
    if (editingId.value) {
      await api.put(`/medications/${editingId.value}`, payload);
      alert.success('Updated', 'Medication was updated successfully.');
    } else {
      await api.post('/medications', payload);
      alert.success('Medication added', 'Your medication schedule was saved.');
    }
    cancelForm();
    await load();
  } catch (e) {
    alert.error(e.response?.data?.error || 'Failed to save medication');
  } finally {
    saving.value = false;
  }
}

async function removeMed(m) {
  const ok = window.confirm(`Delete this medication?\n\n${m.name}${m.dosage ? ` — ${m.dosage}` : ''}`);
  if (!ok) return;
  deletingId.value = m.id;
  try {
    await api.delete(`/medications/${m.id}`);
    alert.success('Deleted', 'Medication was removed.');
    if (editingId.value === m.id) cancelForm();
    await load();
  } catch (e) {
    alert.error(e.response?.data?.error || 'Failed to delete');
  } finally {
    deletingId.value = null;
  }
}

function buildConfig() {
  const t = form.value.frequencyType;
  if (t === 'weekdays') return { weekdays: form.value.frequencyConfig.weekdays || ['mon', 'wed', 'fri'] };
  if (t === 'multiple_daily') return { times: form.value.frequencyConfig.times || ['08:00', '20:00'] };
  if (t === 'custom_interval') return { intervalDays: form.value.frequencyConfig.intervalDays || 3 };
  return {};
}

async function markTaken(id) {
  await api.post(`/medications/checklist/${id}/taken`);
  alert.success('Taken', 'Medication marked as taken.');
  await load();
}

async function resetTodayChecklist() {
  const ok = window.confirm(
    "Reset today's checklist?\n\nAll doses for today will be cleared and rebuilt as pending."
  );
  if (!ok) return;
  resettingChecklist.value = true;
  try {
    const { data } = await api.post('/medications/checklist/today/reset');
    checklist.value = data.checklist;
    alert.success('Reset', "Today's checklist was reset.");
  } catch (e) {
    alert.error(e.response?.data?.error || 'Failed to reset checklist');
  } finally {
    resettingChecklist.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
          <i class="ph-duotone ph-pill text-3xl"></i>
        </div>
        <div>
          <h1 class="text-3xl md:text-4xl font-bold tracking-tight">Medications</h1>
          <p class="text-slate-500 font-medium mt-1">Manage and track prescriptions</p>
        </div>
      </div>
      <button
        v-if="auth.canWrite"
        type="button"
        class="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        @click="showForm ? cancelForm() : openAdd()"
      >
        <i :class="showForm ? 'ph-bold ph-x' : 'ph-bold ph-plus'" class="text-lg"></i>
        {{ showForm ? 'Cancel' : 'Add Medication' }}
      </button>
    </div>

    <form v-if="showForm && auth.canWrite" class="card p-6 space-y-4" @submit.prevent="saveMed">
      <h2 class="font-semibold">{{ editingId ? 'Edit medication' : 'Add medication' }}</h2>
      <input v-model="form.name" required placeholder="Medication name" class="input-field" />
      <input v-model="form.dosage" placeholder="Dosage" class="input-field" />
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="text-sm text-slate-500">Start date</label>
          <input v-model="form.startDate" type="date" required class="input-field" />
        </div>
        <div>
          <label class="text-sm text-slate-500">End date (optional)</label>
          <input v-model="form.endDate" type="date" class="input-field" />
        </div>
        <div>
          <label class="text-sm text-slate-500">Reminder time</label>
          <input v-model="form.reminderTime" type="time" required class="input-field" />
        </div>
        <div>
          <label class="text-sm text-slate-500">Frequency</label>
          <select v-model="form.frequencyType" class="input-field">
            <option value="daily">Daily</option>
            <option value="every_other_day">Every other day</option>
            <option value="weekdays">Specific weekdays</option>
            <option value="multiple_daily">Multiple times per day</option>
            <option value="custom_interval">Custom interval (days)</option>
          </select>
        </div>
      </div>
      <textarea v-model="form.notes" placeholder="Notes" class="input-field" rows="2" />
      <button type="submit" class="btn-primary" :disabled="saving">
        {{ saving ? 'Saving...' : editingId ? 'Update medication' : 'Save medication' }}
      </button>
    </form>

    <section class="card p-5 md:p-7">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <i class="ph-duotone ph-check-square text-xl"></i>
          </div>
          <h2 class="text-xl font-bold">Today's checklist</h2>
        </div>
        <button
          v-if="auth.canWrite"
          type="button"
          class="btn-secondary text-sm flex items-center gap-2"
          :disabled="resettingChecklist"
          @click="resetTodayChecklist"
        >
          <i :class="resettingChecklist ? 'ph ph-spinner animate-spin' : 'ph ph-arrow-counter-clockwise'" />
          {{ resettingChecklist ? 'Resetting...' : 'Reset today' }}
        </button>
      </div>
      <p v-if="!checklist.length" class="text-sm text-slate-500 mb-4">No doses scheduled for today.</p>
      <ul v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <li
          v-for="item in checklist"
          :key="item.id"
          class="flex items-center justify-between p-4 rounded-2xl border transition-all"
          :class="item.status === 'taken' ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
            : item.status === 'missed' ? 'bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'"
        >
          <div>
            <p class="font-medium">{{ item.name }}</p>
            <p class="text-sm text-slate-500">{{ item.dosage }} · {{ item.scheduledTime }}</p>
          </div>
          <button
            v-if="item.status === 'pending' && auth.canWrite"
            type="button"
            class="btn-primary text-sm py-2 px-4 shadow-none"
            @click="markTaken(item.id)"
          >
            Taken
          </button>
          <span v-else class="text-sm font-semibold flex items-center gap-1.5" :class="item.status === 'taken' ? 'text-emerald-600' : 'text-red-600'">
            <i :class="item.status === 'taken' ? 'ph-fill ph-check-circle' : 'ph-fill ph-warning-circle'" class="text-lg"></i>
            {{ item.status }}
          </span>
        </li>
      </ul>
    </section>

    <section class="card p-5 md:p-7">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <i class="ph-duotone ph-pill text-xl"></i>
        </div>
        <h2 class="text-xl font-bold">Active medications</h2>
      </div>
      <ul class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        <li v-for="m in meds" :key="m.id" class="p-5 rounded-[1.25rem] border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/40 shadow-sm transition-transform hover:-translate-y-1 flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm">
                <i class="ph-duotone ph-pill text-2xl text-slate-500 dark:text-slate-400"></i>
              </div>
              <div class="flex items-center gap-1">
                <span class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{{ m.frequencyType.replace(/_/g, ' ') }}</span>
                <button
                  v-if="auth.canWrite"
                  type="button"
                  class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Edit"
                  @click="openEdit(m)"
                >
                  <i class="ph ph-pencil-simple text-lg" />
                </button>
                <button
                  v-if="auth.canWrite"
                  type="button"
                  class="p-2 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                  :disabled="deletingId === m.id"
                  title="Delete"
                  @click="removeMed(m)"
                >
                  <i v-if="deletingId === m.id" class="ph ph-spinner text-lg animate-spin" />
                  <i v-else class="ph ph-trash text-lg" />
                </button>
              </div>
            </div>
            <p class="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight">{{ m.name }}</p>
            <p class="text-sm font-medium text-slate-500 mt-1">{{ m.dosage }}</p>
          </div>
          <div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span class="flex items-center gap-1.5"><i class="ph-duotone ph-clock text-sm"></i> {{ m.reminderTime.substring(0, 5) }}</span>
            <span class="flex items-center gap-1.5"><i class="ph-duotone ph-calendar-blank text-sm"></i> {{ m.startDate.substring(5) }} &rarr; {{ m.endDate ? m.endDate.substring(5) : 'Ongoing' }}</span>
          </div>
        </li>
      </ul>
      <PaginationBar
        v-if="medPagination.totalPages > 1"
        :page="medPagination.page"
        :total-pages="medPagination.totalPages"
        :total="medPagination.total"
        @update:page="onMedPageChange"
      />
    </section>
  </div>
</template>
