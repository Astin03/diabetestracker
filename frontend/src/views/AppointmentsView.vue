<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { useAlert } from '../composables/useAlert';
import { format, parseISO } from 'date-fns';
import PaginationBar from '../components/common/PaginationBar.vue';

const alert = useAlert();
const upcoming = ref([]);
const past = ref([]);
const upcomingPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const pastPagination = ref({ page: 1, limit: 10, total: 0, totalPages: 1 });
const upcomingPage = ref(1);
const pastPage = ref(1);
const loading = ref(true);
const saving = ref(false);
const deletingId = ref(null);
const editingId = ref(null);
const showForm = ref(false);

const APPT_TYPES = [
  { value: 'doctor', label: 'Doctor', icon: 'ph ph-stethoscope', color: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300' },
  { value: 'lab', label: 'Lab', icon: 'ph ph-flask', color: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300' },
  { value: 'other', label: 'Other', icon: 'ph ph-calendar-check', color: 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300' },
];

const emptyForm = () => ({
  title: '',
  type: 'doctor',
  appointmentAt: '',
  location: '',
  notes: '',
});

const form = ref(emptyForm());

function toInputDatetime(value) {
  if (!value) return '';
  try {
    const normalized = String(value).includes('T') ? value : value.replace(' ', 'T');
    return format(parseISO(normalized), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}

function typeMeta(type) {
  return APPT_TYPES.find((t) => t.value === type) || APPT_TYPES[2];
}

function formatApptDate(value) {
  try {
    const normalized = String(value).includes('T') ? value : value.replace(' ', 'T');
    return format(parseISO(normalized), 'EEE, MMM d, yyyy · h:mm a');
  } catch {
    return value;
  }
}

async function loadUpcoming() {
  const { data } = await api.get('/appointments', {
    params: { status: 'upcoming', page: upcomingPage.value, limit: 10 },
  });
  upcoming.value = data.appointments;
  upcomingPagination.value = data.pagination;
  if (upcomingPage.value > data.pagination.totalPages && data.pagination.totalPages > 0) {
    upcomingPage.value = data.pagination.totalPages;
    return loadUpcoming();
  }
}

async function loadPast() {
  const { data } = await api.get('/appointments', {
    params: { status: 'past', page: pastPage.value, limit: 10 },
  });
  past.value = data.appointments;
  pastPagination.value = data.pagination;
  if (pastPage.value > data.pagination.totalPages && data.pagination.totalPages > 0) {
    pastPage.value = data.pagination.totalPages;
    return loadPast();
  }
}

async function load() {
  loading.value = true;
  try {
    await Promise.all([loadUpcoming(), loadPast()]);
  } finally {
    loading.value = false;
  }
}

function onUpcomingPageChange(p) {
  upcomingPage.value = p;
  loadUpcoming();
}

function onPastPageChange(p) {
  pastPage.value = p;
  loadPast();
}

function openAdd() {
  editingId.value = null;
  form.value = emptyForm();
  showForm.value = true;
}

function openEdit(appt) {
  editingId.value = appt.id;
  form.value = {
    title: appt.title,
    type: appt.type,
    appointmentAt: toInputDatetime(appt.appointmentAt),
    location: appt.location || '',
    notes: appt.notes || '',
  };
  showForm.value = true;
}

function cancelForm() {
  showForm.value = false;
  editingId.value = null;
  form.value = emptyForm();
}

async function save() {
  if (!form.value.title?.trim() || !form.value.appointmentAt) {
    alert.warning('Missing fields', 'Title and date/time are required.');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      title: form.value.title.trim(),
      type: form.value.type,
      appointmentAt: form.value.appointmentAt,
      location: form.value.location || null,
      notes: form.value.notes || null,
    };
    if (editingId.value) {
      await api.put(`/appointments/${editingId.value}`, payload);
      alert.success('Updated', 'Appointment was updated successfully.');
    } else {
      await api.post('/appointments', payload);
      alert.success('Appointment added', 'Your appointment was saved.');
    }
    cancelForm();
    await load();
  } catch (e) {
    alert.error(e.response?.data?.error || 'Failed to save');
  } finally {
    saving.value = false;
  }
}

async function removeAppt(appt) {
  const ok = window.confirm(`Delete appointment?\n\n${appt.title}\n${formatApptDate(appt.appointmentAt)}`);
  if (!ok) return;
  deletingId.value = appt.id;
  try {
    await api.delete(`/appointments/${appt.id}`);
    alert.success('Deleted', 'Appointment was removed.');
    if (editingId.value === appt.id) cancelForm();
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
  <div class="space-y-6 max-w-3xl">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Appointments</h1>
        <p class="text-sm text-slate-500 mt-1">Doctor visits, lab work, and more</p>
      </div>
      <button v-if="!showForm" type="button" class="btn-primary flex items-center gap-1" @click="openAdd">
        <i class="ph ph-plus" /> Add appointment
      </button>
    </div>

    <form v-if="showForm" class="card p-6 space-y-4" @submit.prevent="save">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">{{ editingId ? 'Edit appointment' : 'New appointment' }}</h2>
        <button type="button" class="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" @click="cancelForm">
          Cancel
        </button>
      </div>

      <input v-model="form.title" required class="input-field" placeholder="Title (e.g. Endocrinologist visit)" />

      <div>
        <label class="text-sm text-slate-500">Type</label>
        <div class="grid grid-cols-3 gap-2 mt-2">
          <button
            v-for="t in APPT_TYPES"
            :key="t.value"
            type="button"
            class="py-2.5 rounded-xl border-2 text-sm font-medium transition flex flex-col items-center gap-1"
            :class="form.type === t.value
              ? 'border-astin-600 bg-astin-50 dark:bg-astin-900/30'
              : 'border-slate-200 dark:border-slate-700'"
            @click="form.type = t.value"
          >
            <i :class="t.icon" class="text-lg" />
            {{ t.label }}
          </button>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="text-sm text-slate-500">Date & time</label>
          <input v-model="form.appointmentAt" type="datetime-local" required class="input-field mt-1" />
        </div>
        <div>
          <label class="text-sm text-slate-500">Location</label>
          <input v-model="form.location" class="input-field mt-1" placeholder="Clinic, hospital, etc." />
        </div>
      </div>

      <div>
        <label class="text-sm text-slate-500">Notes</label>
        <textarea v-model="form.notes" rows="3" class="input-field mt-1" placeholder="Questions to ask, fasting instructions..." />
      </div>

      <button type="submit" class="btn-primary" :disabled="saving">
        {{ saving ? 'Saving...' : editingId ? 'Update appointment' : 'Save appointment' }}
      </button>
    </form>

    <div v-if="loading" class="card p-8">
      <div class="skeleton h-32" />
    </div>

    <template v-else>
      <section class="space-y-3">
        <h2 class="font-semibold text-sm text-slate-500 uppercase tracking-wide">
          Upcoming ({{ upcomingPagination.total }})
        </h2>
        <p v-if="!upcoming.length" class="text-sm text-slate-500 card p-6">No upcoming appointments.</p>
        <article
          v-for="appt in upcoming"
          :key="appt.id"
          class="card p-5 border-l-4 border-astin-500"
        >
          <div class="flex items-start gap-4">
            <div
              class="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0"
              :class="typeMeta(appt.type).color"
            >
              <i :class="typeMeta(appt.type).icon" class="text-xl" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-lg">{{ appt.title }}</p>
              <span
                class="inline-block text-xs font-medium px-2 py-0.5 rounded-full border mt-1"
                :class="typeMeta(appt.type).color"
              >
                {{ typeMeta(appt.type).label }}
              </span>
              <p class="text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1">
                <i class="ph ph-clock" />
                {{ formatApptDate(appt.appointmentAt) }}
              </p>
              <p v-if="appt.location" class="text-sm text-slate-500 mt-1 flex items-center gap-1">
                <i class="ph ph-map-pin" />
                {{ appt.location }}
              </p>
              <p v-if="appt.notes" class="text-sm mt-2 text-slate-600 dark:text-slate-400">{{ appt.notes }}</p>
            </div>
            <div class="flex gap-1 shrink-0">
              <button
                type="button"
                class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Edit"
                @click="openEdit(appt)"
              >
                <i class="ph ph-pencil-simple text-lg" />
              </button>
              <button
                type="button"
                class="p-2 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                :disabled="deletingId === appt.id"
                title="Delete"
                @click="removeAppt(appt)"
              >
                <i v-if="deletingId === appt.id" class="ph ph-spinner text-lg animate-spin" />
                <i v-else class="ph ph-trash text-lg" />
              </button>
            </div>
          </div>
        </article>
        <PaginationBar
          v-if="upcomingPagination.totalPages > 1"
          :page="upcomingPagination.page"
          :total-pages="upcomingPagination.totalPages"
          :total="upcomingPagination.total"
          @update:page="onUpcomingPageChange"
        />
      </section>

      <section v-if="pastPagination.total > 0" class="space-y-3 pt-4">
        <h2 class="font-semibold text-sm text-slate-500 uppercase tracking-wide">
          Past ({{ pastPagination.total }})
        </h2>
        <article
          v-for="appt in past"
          :key="appt.id"
          class="card p-5 opacity-80"
        >
          <div class="flex items-start gap-4">
            <div
              class="w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 opacity-70"
              :class="typeMeta(appt.type).color"
            >
              <i :class="typeMeta(appt.type).icon" class="text-xl" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold">{{ appt.title }}</p>
              <p class="text-sm text-slate-500 mt-1">{{ formatApptDate(appt.appointmentAt) }}</p>
              <p v-if="appt.location" class="text-sm text-slate-500">{{ appt.location }}</p>
            </div>
            <div class="flex gap-1 shrink-0">
              <button type="button" class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" @click="openEdit(appt)">
                <i class="ph ph-pencil-simple text-lg" />
              </button>
              <button
                type="button"
                class="p-2 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                :disabled="deletingId === appt.id"
                @click="removeAppt(appt)"
              >
                <i v-if="deletingId === appt.id" class="ph ph-spinner text-lg animate-spin" />
                <i v-else class="ph ph-trash text-lg" />
              </button>
            </div>
          </div>
        </article>
        <PaginationBar
          v-if="pastPagination.totalPages > 1"
          :page="pastPagination.page"
          :total-pages="pastPagination.totalPages"
          :total="pastPagination.total"
          @update:page="onPastPageChange"
        />
      </section>
    </template>
  </div>
</template>
