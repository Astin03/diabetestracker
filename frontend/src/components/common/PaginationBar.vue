<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['update:page']);

const canPrev = computed(() => props.page > 1 && !props.loading);
const canNext = computed(() => props.page < props.totalPages && !props.loading);

function goTo(p) {
  if (p < 1 || p > props.totalPages || p === props.page || props.loading) return;
  emit('update:page', p);
}
</script>

<template>
  <div
    v-if="totalPages > 1"
    class="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700"
  >
    <p class="text-sm text-slate-500">
      Page {{ page }} of {{ totalPages }}
      <span v-if="total"> · {{ total }} total</span>
    </p>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="btn-secondary text-sm py-2 px-3 disabled:opacity-40"
        :disabled="!canPrev"
        @click="goTo(page - 1)"
      >
        <i class="ph ph-caret-left" /> Previous
      </button>
      <button
        type="button"
        class="btn-secondary text-sm py-2 px-3 disabled:opacity-40"
        :disabled="!canNext"
        @click="goTo(page + 1)"
      >
        Next <i class="ph ph-caret-right" />
      </button>
    </div>
  </div>
</template>
