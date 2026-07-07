<script setup>
import { ref, onMounted } from 'vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { useNotifications } from '../composables/useNotifications';

useNotifications();
onMounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker?.ready?.catch(() => {});
  }
});

const isSidebarOpen = ref(false);
</script>

<template>
  <div class="min-h-screen flex bg-slate-50 dark:bg-slate-950">
    <div 
      v-if="isSidebarOpen" 
      class="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity"
      @click="isSidebarOpen = false"
    ></div>

    <AppSidebar 
      :is-open="isSidebarOpen" 
      @close="isSidebarOpen = false" 
    />
    
    <main class="flex-1 flex flex-col min-h-screen lg:ml-64 w-full max-w-full overflow-hidden">
      <header class="lg:hidden print:hidden sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-astin-500 to-astin-700 flex items-center justify-center shrink-0 shadow shadow-astin-600/30">
            <svg viewBox="0 0 24 24" fill="none" class="w-5 h-5 text-white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path>
              <path d="M9.5 15.5h5"></path>
              <path d="M12 10.5l-2.5 7"></path>
              <path d="M12 10.5l2.5 7"></path>
            </svg>
          </div>
          <div>
            <h1 class="font-bold text-lg leading-tight tracking-tight">Astin</h1>
            <p class="text-xs text-slate-500 font-medium">Diabetes System</p>
          </div>
        </div>
        <button 
          type="button" 
          class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
          @click="isSidebarOpen = true"
        >
          <i class="ph ph-list text-xl"></i>
        </button>
      </header>

      <div class="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <RouterView />
      </div>
    </main>
  </div>
</template>
