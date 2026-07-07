<script setup>
import { ref } from 'vue';
import { READING_TYPES } from '../../utils/glucose';
import { format } from 'date-fns';

const emit = defineEmits(['submit']);
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
  <form class="card p-6 space-y-4" @submit.prevent="submit">
    <h3 class="font-semibold text-lg">Log blood sugar</h3>
    <div class="grid sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm text-slate-500 mb-1">Value (mg/dL)</label>
        <input v-model="form.value" type="number" step="0.1" min="20" max="600" required class="input-field text-2xl font-bold" placeholder="120" />
      </div>
      <div>
        <label class="block text-sm text-slate-500 mb-1">Reading type</label>
        <select v-model="form.readingType" class="input-field">
          <option v-for="r in READING_TYPES" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm text-slate-500 mb-1">Date & time</label>
        <input v-model="form.recordedAt" type="datetime-local" required class="input-field" />
      </div>
      <div>
        <label class="block text-sm text-slate-500 mb-1">Meal notes (optional)</label>
        <input v-model="form.mealNotes" class="input-field" placeholder="e.g. rice & chicken" />
      </div>
    </div>
    <div>
      <label class="block text-sm text-slate-500 mb-1">Notes</label>
      <textarea v-model="form.notes" rows="2" class="input-field" placeholder="How are you feeling?" />
    </div>
    <button type="submit" class="btn-primary w-full sm:w-auto" :disabled="loading">
      {{ loading ? 'Saving...' : 'Save reading' }}
    </button>
  </form>
</template>
