<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';
import {
  format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths,
} from 'date-fns';

const current = ref(new Date());
const selected = ref(format(new Date(), 'yyyy-MM-dd'));
const dayData = ref(null);
const monthEvents = ref({});

const APPT_TYPES = {
  doctor: {
    label: 'Doctor',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    border: 'border-blue-400',
  },
  lab: {
    label: 'Lab',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    border: 'border-amber-400',
  },
  other: {
    label: 'Other',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    border: 'border-slate-400',
  },
};

const days = computed(() => {
  const start = startOfWeek(startOfMonth(current.value));
  const end = endOfWeek(endOfMonth(current.value));
  return eachDayOfInterval({ start, end });
});

function dateKey(value) {
  if (!value) return '';
  const s = String(value);
  if (s.length >= 10 && s[4] === '-' && s[7] === '-') return s.slice(0, 10);
  try {
    return format(parseISO(s.includes('T') ? s : s.replace(' ', 'T')), 'yyyy-MM-dd');
  } catch {
    return s.slice(0, 10);
  }
}

function timeLabel(value) {
  if (!value) return '';
  try {
    const s = String(value).includes('T') ? value : String(value).replace(' ', 'T');
    return format(parseISO(s), 'h:mm a');
  } catch {
    return String(value).slice(11, 16);
  }
}

function apptMeta(type) {
  return APPT_TYPES[type] || APPT_TYPES.other;
}

async function loadMonth() {
  const from = format(startOfMonth(current.value), 'yyyy-MM-dd');
  const to = format(endOfMonth(current.value), 'yyyy-MM-dd');

  const [glucRes, apptRes, medRes] = await Promise.all([
    api.get('/glucose', { params: { from, to, page: 1, limit: 500 } }),
    api.get('/appointments', { params: { from, to, page: 1, limit: 200 } }),
    api.get('/medications/checklist/calendar', { params: { from, to } }),
  ]);

  const map = {};

  for (const log of glucRes.data.logs) {
    const d = dateKey(log.recordedAt);
    if (!map[d]) map[d] = { glucose: 0, hasAlert: false, appointments: [], meds: 0 };
    map[d].glucose++;
    if (log.category !== 'normal') map[d].hasAlert = true;
  }

  for (const appt of apptRes.data.appointments) {
    const d = dateKey(appt.appointmentAt);
    if (!d) continue;
    if (!map[d]) map[d] = { glucose: 0, hasAlert: false, appointments: [], meds: 0 };
    map[d].appointments.push(appt);
  }

  for (const med of medRes.data.calendar || []) {
    const d = dateKey(med.scheduled_date);
    if (!d) continue;
    if (!map[d]) map[d] = { glucose: 0, hasAlert: false, appointments: [], meds: 0 };
    map[d].meds += parseInt(med.count, 10) || 0;
  }

  for (const key of Object.keys(map)) {
    map[key].appointments.sort((a, b) =>
      String(a.appointmentAt).localeCompare(String(b.appointmentAt))
    );
  }

  monthEvents.value = map;
}

async function loadDay() {
  const { data } = await api.get(`/calendar/${selected.value}`);
  dayData.value = data;
}

async function selectDay(d) {
  selected.value = format(d, 'yyyy-MM-dd');
  await loadDay();
}

async function changeMonth(delta) {
  current.value = delta > 0 ? addMonths(current.value, 1) : subMonths(current.value, 1);
  await loadMonth();
}

onMounted(async () => {
  await loadMonth();
  await loadDay();
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-bold">Medical calendar</h1>
      <RouterLink to="/appointments" class="btn-secondary text-sm flex items-center gap-1">
        <i class="ph ph-calendar-plus" /> Manage appointments
      </RouterLink>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap gap-3 text-xs text-slate-500">
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-blue-500" /> Appointment</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-500" /> Medications</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-astin-500" /> Glucose</span>
      <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-red-500" /> Alert</span>
    </div>

    <div class="card p-0 overflow-hidden border border-slate-200 dark:border-slate-800">
      <div class="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button type="button" class="btn-secondary px-3 py-1.5" @click="changeMonth(-1)">
          <i class="ph ph-caret-left" />
        </button>
        <h2 class="font-semibold text-lg">{{ format(current, 'MMMM yyyy') }}</h2>
        <button type="button" class="btn-secondary px-3 py-1.5" @click="changeMonth(1)">
          <i class="ph ph-caret-right" />
        </button>
      </div>

      <div class="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800">
        <div
          v-for="d in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']"
          :key="d"
          class="bg-slate-50 dark:bg-slate-800 p-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider"
        >
          {{ d }}
        </div>

        <button
          v-for="day in days"
          :key="day.toISOString()"
          type="button"
          class="bg-white dark:bg-slate-900 min-h-[88px] md:min-h-[120px] p-1.5 md:p-2 flex flex-col transition hover:bg-slate-50 dark:hover:bg-slate-800/80 outline-none text-left"
          :class="[
            selected === format(day, 'yyyy-MM-dd') ? 'ring-inset ring-2 ring-astin-500 z-10 relative' : '',
            !isSameMonth(day, current) ? 'opacity-40 bg-slate-50 dark:bg-slate-900/50' : '',
          ]"
          @click="selectDay(day)"
        >
          <span
            class="text-xs md:text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 shrink-0 self-center md:self-start"
            :class="isToday(day) ? 'bg-astin-600 text-white' : ''"
          >
            {{ format(day, 'd') }}
          </span>

          <div class="flex-1 w-full space-y-0.5 overflow-hidden">
            <template v-if="monthEvents[format(day, 'yyyy-MM-dd')]">
              <!-- Appointments (always visible) -->
              <div
                v-for="appt in monthEvents[format(day, 'yyyy-MM-dd')].appointments.slice(0, 3)"
                :key="appt.id"
                class="w-full truncate text-[9px] md:text-[10px] px-1 py-0.5 rounded font-medium"
                :class="apptMeta(appt.type).badge"
              >
                <i class="ph ph-calendar-blank" />
                {{ timeLabel(appt.appointmentAt) }} {{ appt.title }}
              </div>
              <div
                v-if="monthEvents[format(day, 'yyyy-MM-dd')].appointments.length > 3"
                class="text-[9px] text-blue-600 dark:text-blue-400 px-1"
              >
                +{{ monthEvents[format(day, 'yyyy-MM-dd')].appointments.length - 3 }} more
              </div>

              <div
                v-if="monthEvents[format(day, 'yyyy-MM-dd')].meds"
                class="w-full truncate text-[9px] md:text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1 py-0.5 rounded font-medium"
              >
                {{ monthEvents[format(day, 'yyyy-MM-dd')].meds }} meds
              </div>
              <div
                v-if="monthEvents[format(day, 'yyyy-MM-dd')].glucose"
                class="w-full truncate text-[9px] md:text-[10px] bg-astin-100 text-astin-700 dark:bg-astin-900/30 dark:text-astin-400 px-1 py-0.5 rounded font-medium"
              >
                {{ monthEvents[format(day, 'yyyy-MM-dd')].glucose }} glucose
              </div>
            </template>
          </div>
        </button>
      </div>
    </div>

    <div v-if="dayData" class="card p-6 space-y-5">
      <h2 class="font-semibold text-lg">{{ format(parseISO(selected), 'EEEE, MMMM d') }}</h2>

      <!-- Appointments first -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium flex items-center gap-2">
            <i class="ph ph-calendar-check text-blue-500" />
            Appointments
            <span class="text-xs font-normal text-slate-500">({{ dayData.appointments?.length || 0 }})</span>
          </h3>
          <RouterLink to="/appointments" class="text-xs text-astin-600 hover:underline">Add / edit</RouterLink>
        </div>
        <p v-if="!dayData.appointments?.length" class="text-sm text-slate-500 py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800">
          No appointments this day.
        </p>
        <ul v-else class="space-y-2">
          <li
            v-for="a in dayData.appointments"
            :key="a.id"
            class="p-4 rounded-xl border-l-4 bg-blue-50 dark:bg-blue-900/20"
            :class="apptMeta(a.type).border"
          >
            <div>
              <p class="font-semibold">{{ a.title }}</p>
                <span
                  class="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
                  :class="apptMeta(a.type).badge"
                >
                  {{ apptMeta(a.type).label }}
                </span>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1">
                  <i class="ph ph-clock" />
                  {{ timeLabel(a.appointmentAt) }}
                </p>
                <p v-if="a.location" class="text-sm text-slate-500 mt-1 flex items-center gap-1">
                  <i class="ph ph-map-pin" />
                  {{ a.location }}
                </p>
                <p v-if="a.notes" class="text-sm mt-2 text-slate-600 dark:text-slate-400">{{ a.notes }}</p>
            </div>
          </li>
        </ul>
      </section>

      <div class="grid sm:grid-cols-3 gap-4 text-center">
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
          <p class="text-xs text-slate-500">Avg glucose</p>
          <p class="text-xl font-bold">{{ dayData.stats?.avg ?? '—' }}</p>
        </div>
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
          <p class="text-xs text-slate-500">Readings</p>
          <p class="text-xl font-bold">{{ dayData.stats?.count ?? 0 }}</p>
        </div>
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
          <p class="text-xs text-slate-500">Est. A1C</p>
          <p class="text-xl font-bold">{{ dayData.stats?.estimatedA1C?.toFixed?.(1) ?? '—' }}</p>
        </div>
      </div>

      <section v-if="dayData.glucoseLogs?.length">
        <h3 class="font-medium mb-2">Glucose logs</h3>
        <ul class="space-y-2 text-sm">
          <li v-for="g in dayData.glucoseLogs" :key="g.id" class="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
            <span>{{ g.value }} mg/dL</span>
            <span class="text-slate-500">{{ g.recorded_at?.slice?.(11, 16) }}</span>
          </li>
        </ul>
      </section>

      <section v-if="dayData.insulinLogs?.length">
        <h3 class="font-medium mb-2">Insulin</h3>
        <ul class="space-y-2 text-sm">
          <li
            v-for="ins in dayData.insulinLogs"
            :key="ins.id"
            class="flex justify-between p-2 rounded-lg"
            :class="ins.insulinType === 'apidra' ? 'bg-sky-500/10' : 'bg-violet-500/10'"
          >
            <span>{{ ins.insulinType === 'apidra' ? 'Apidra' : 'Lantus' }} · {{ ins.meal || '—' }} — {{ ins.units }} u</span>
            <span class="text-slate-500">{{ ins.recordedAt?.slice?.(11, 16) }}</span>
          </li>
        </ul>
      </section>

      <section v-if="dayData.medications?.length">
        <h3 class="font-medium mb-2">Medications</h3>
        <ul class="space-y-2 text-sm">
          <li
            v-for="m in dayData.medications"
            :key="m.id"
            class="flex justify-between p-2 rounded-lg"
            :class="m.status === 'taken' ? 'bg-emerald-500/10' : m.status === 'missed' ? 'bg-red-500/10' : 'bg-slate-50 dark:bg-slate-800'"
          >
            <span>{{ m.name }}</span>
            <span :class="m.status === 'taken' ? 'text-emerald-600' : m.status === 'missed' ? 'text-red-600' : 'text-slate-500'">{{ m.status }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
