<script setup>
import { useToastStore } from '../../stores/toast';

const toast = useToastStore();
const colors = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-astin-600',
  warning: 'bg-amber-600',
};
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
    <TransitionGroup name="fade">
      <div
        v-for="t in toast.toasts"
        :key="t.id"
        :class="[colors[t.type] || colors.info, 'px-4 py-3 rounded-xl text-white shadow-lg text-sm']"
      >
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>
