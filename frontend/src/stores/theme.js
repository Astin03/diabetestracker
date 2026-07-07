import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const dark = ref(true);

  function init() {
    dark.value = true;
    document.documentElement.classList.add('dark');
  }

  return { dark, init };
});
