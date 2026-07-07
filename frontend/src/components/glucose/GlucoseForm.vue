<script setup>
import { ref } from 'vue';
import { READING_TYPES } from '../../utils/glucose';
import { format } from 'date-fns';

defineProps({
  showTitle: { type: Boolean, default: true },
});

const emit = defineEmits(['submit', 'cancel']);
const loading = ref(false);

const form = ref({
  value: '',
  readingType: 'random',
  recordedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  notes: '',
  mealNotes: '',
});

async function submit() {
  loading.value = true;
  try {
    await emit('submit', {
      ...form.value,
      value: parseFloat(form.value.value),
    });
    form.value.value = '';
    form.value.notes = '';
    form.value.mealNotes = '';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <form class="card p-5 md:p-7 space-y-5 border-astin-200/60 dark:border-astin-500/20" @submit.prevent="submit">
    <div class="flex items-center justify-between gap-3">
      <h3 v-if="showTitle" class="font-bold text-lg flex items-center gap-2">
        <i class="ph-duotone ph-drop text-astin-600 text-xl"></i>
        Log blood sugar
      </h3>
      <button
        type="button"
        class="ml-auto p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Close"
        @click="emit('cancel')"
      >
        <i class="ph ph-x text-lg"></i>
      </button>
    </div>

    <div class="grid sm:grid-cols-2 gap-4">
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-500 mb-1">Value (mg/dL)</label>
        <input
          v-model="form.value"
          type="number"
          step="0.1"
          min="20"
          max="600"
          required
          class="input-field text-3xl font-bold text-center"
          placeholder="120"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-500 mb-1">Reading type</label>
        <select v-model="form.readingType" class="input-field">
          <option v-for="r in READING_TYPES" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-500 mb-1">Date & time</label>
        <input v-model="form.recordedAt" type="datetime-local" required class="input-field" />
      </div>
      <div class="sm:col-span-2">
        <label class="block text-sm font-medium text-slate-500 mb-1">Meal notes (optional)</label>
        <input v-model="form.mealNotes" class="input-field" placeholder="e.g. rice & chicken" />
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-500 mb-1">Notes</label>
      <textarea v-model="form.notes" rows="2" class="input-field" placeholder="How are you feeling?" />
    </div>
    <div class="flex flex-wrap gap-3">
      <button type="submit" class="btn-primary flex-1 sm:flex-none min-w-[140px]" :disabled="loading">
        {{ loading ? 'Saving...' : 'Save reading' }}
      </button>
      <button type="button" class="btn-secondary" @click="emit('cancel')">Cancel</button>
    </div>
  </form>
</template>
