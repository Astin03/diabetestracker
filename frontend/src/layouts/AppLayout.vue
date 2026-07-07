<script setup>
import { ref, onMounted } from 'vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import PatientSwitcher from '../components/layout/PatientSwitcher.vue';
import AppLogo from '../components/common/AppLogo.vue';
import { useNotifications } from '../composables/useNotifications';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
useNotifications();
onMounted(async () => {
  if (auth.isAuthenticated) await auth.loadCareData();
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
        <RouterLink to="/" class="flex items-center gap-2 min-w-0 flex-1">
          <AppLogo variant="brand" size="sm" />
        </RouterLink>
        <button 
          type="button" 
          class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
          @click="isSidebarOpen = true"
        >
          <i class="ph ph-list text-xl"></i>
        </button>
      </header>

      <div class="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <PatientSwitcher />
        <RouterView />
      </div>
    </main>
  </div>
</template>
