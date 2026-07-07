<script setup>
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
const route = useRoute();
const auth = useAuthStore();

defineProps({
  isOpen: Boolean
});
defineEmits(['close']);

const linkGroups = [
  {
    name: 'Overview',
    links: [
      { to: '/', name: 'Dashboard', icon: 'ph-duotone ph-squares-four' },
      { to: '/calendar', name: 'Calendar', icon: 'ph-duotone ph-calendar-blank' },
      { to: '/appointments', name: 'Appointments', icon: 'ph-duotone ph-calendar-plus' },
    ]
  },
  {
    name: 'Tracking',
    links: [
      { to: '/glucose', name: 'Log Glucose', icon: 'ph-duotone ph-drop' },
      { to: '/insulin', name: 'Insulin', icon: 'ph-duotone ph-syringe' },
      { to: '/meal-table', name: 'Meal Table', icon: 'ph-duotone ph-table' },
    ]
  },
  {
    name: 'Management',
    links: [
      { to: '/logbook', name: 'Logbook', icon: 'ph-duotone ph-book-open' },
      { to: '/medications', name: 'Medications', icon: 'ph-duotone ph-pill' },
    ]
  },
  {
    name: 'Preferences',
    links: [
      { to: '/settings', name: 'Settings', icon: 'ph-duotone ph-gear' },
    ]
  }
];

function isActive(path) {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
}
</script>

<template>
  <aside 
    class="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 lg:bg-white/50 dark:lg:bg-slate-900/50 lg:backdrop-blur flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 no-print"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-astin-500 to-astin-700 flex items-center justify-center shrink-0 shadow-lg shadow-astin-600/30">
          <svg viewBox="0 0 24 24" fill="none" class="w-6 h-6 text-white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        <button type="button" class="lg:hidden text-slate-500" @click="$emit('close')">
          <i class="ph ph-x text-xl"></i>
        </button>
      </div>
    </div>
    
    <nav class="flex-1 p-4 overflow-y-auto space-y-6">
      <div v-for="group in linkGroups" :key="group.name">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-4">{{ group.name }}</h3>
        <div class="space-y-1">
          <RouterLink
            v-for="link in group.links"
            :key="link.to"
            :to="link.to"
            :class="isActive(link.to) ? 'nav-link-active' : 'nav-link'"
            @click="$emit('close')"
          >
            <i :class="[isActive(link.to) ? link.icon.replace('ph-duotone', 'ph-fill') : link.icon, 'text-2xl transition-transform', isActive(link.to) ? '-translate-y-0.5' : '']"></i>
            {{ link.name }}
          </RouterLink>
        </div>
      </div>
    </nav>

    <div class="p-4 border-t border-slate-200 dark:border-slate-800">
      <div class="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl">
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-8 h-8 rounded-full bg-astin-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {{ auth.user?.fullName?.charAt(0) || 'U' }}
          </div>
          <div class="truncate">
            <p class="text-sm font-semibold truncate">{{ auth.user?.fullName || 'User' }}</p>
            <p class="text-xs text-slate-500 truncate">My Profile</p>
          </div>
        </div>
        <button 
          type="button" 
          class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0" 
          @click="auth.logout(); $router.push('/login')"
          title="Sign out"
        >
          <i class="ph-duotone ph-sign-out text-2xl"></i>
        </button>
      </div>
    </div>
  </aside>
</template>
