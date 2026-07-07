import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([]);
  let id = 0;

  function show(message, type = 'info', duration = 4000) {
    const tid = ++id;
    toasts.value.push({ id: tid, message, type });
    setTimeout(() => remove(tid), duration);
  }

  function remove(tid) {
    toasts.value = toasts.value.filter((t) => t.id !== tid);
  }

  return { toasts, show, remove };
});
