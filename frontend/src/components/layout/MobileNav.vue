<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
const links = [
  { to: '/', icon: 'ph ph-squares-four', label: 'Home' },
  { to: '/glucose', icon: 'ph ph-drop', label: 'Log' },
  { to: '/logbook', icon: 'ph ph-book-open', label: 'Book' },
  { to: '/medications', icon: 'ph ph-pill', label: 'Meds' },
  { to: '/calendar', icon: 'ph ph-calendar-blank', label: 'Cal' },
];
</script>

<template>
  <nav class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-slate-200 dark:border-slate-800 safe-area-pb no-print">
    <div class="flex justify-around py-2">
      <RouterLink
        v-for="l in links"
        :key="l.to"
        :to="l.to"
        class="flex flex-col items-center px-4 py-2 text-[10px] sm:text-xs rounded-2xl transition-all"
        :class="route.path === l.to || (l.to !== '/' && route.path.startsWith(l.to))
          ? 'text-astin-600 dark:text-astin-400 font-bold'
          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'"
      >
        <i :class="[(route.path === l.to || (l.to !== '/' && route.path.startsWith(l.to))) ? l.icon.replace('ph ', 'ph-fill ') : l.icon, 'text-2xl mb-1 transition-transform', (route.path === l.to || (l.to !== '/' && route.path.startsWith(l.to))) ? '-translate-y-0.5' : '']"></i>
        {{ l.label }}
      </RouterLink>
    </div>
  </nav>
</template>
