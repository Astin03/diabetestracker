import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { guest: true },
  },
  {
    path: '/choose-data',
    name: 'choose-data',
    component: () => import('../views/ChooseDataView.vue'),
    meta: { requiresAuth: true, skipDataChoice: true },
  },
  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
      { path: 'glucose', name: 'glucose', component: () => import('../views/GlucoseView.vue') },
      { path: 'insulin', name: 'insulin', component: () => import('../views/InsulinView.vue') },
      { path: 'logbook', name: 'logbook', component: () => import('../views/LogbookView.vue') },
      { path: 'meal-table', name: 'meal-table', component: () => import('../views/MealTableView.vue') },
      { path: 'medications', name: 'medications', component: () => import('../views/MedicationsView.vue') },
      { path: 'calendar', name: 'calendar', component: () => import('../views/CalendarView.vue') },
      { path: 'appointments', name: 'appointments', component: () => import('../views/AppointmentsView.vue') },
      { path: 'settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

async function ensureAuthLoaded(auth) {
  if (auth.isAuthenticated && !auth.user) {
    await auth.fetchProfile();
    await auth.loadCareData();
  }
}

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) return '/login';
  if (to.meta.guest && auth.isAuthenticated) {
    await ensureAuthLoaded(auth);
    return auth.needsDataChoice ? '/choose-data' : '/';
  }
  if (to.meta.requiresAuth) {
    try {
      await ensureAuthLoaded(auth);
    } catch {
      auth.logout();
      return '/login';
    }
    if (!to.meta.skipDataChoice && auth.needsDataChoice) {
      return '/choose-data';
    }
    if (to.name === 'choose-data' && !auth.isGuardian) {
      return '/';
    }
  }
});

export default router;
