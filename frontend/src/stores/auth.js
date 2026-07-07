import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('astin_token'));
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  async function register(payload) {
    loading.value = true;
    try {
      const { data } = await api.post('/auth/register', payload);
      setSession(data);
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function login(payload) {
    loading.value = true;
    try {
      const { data } = await api.post('/auth/login', payload);
      setSession(data);
      return data;
    } finally {
      loading.value = false;
    }
  }

  function setSession({ token: t, user: u }) {
    token.value = t;
    user.value = u;
    localStorage.setItem('astin_token', t);
    if (u?.darkMode != null) {
      localStorage.setItem('astin_dark', String(u.darkMode));
    }
  }

  async function fetchProfile() {
    if (!token.value) return;
    const { data } = await api.get('/auth/profile');
    user.value = data.user;
    return data.user;
  }

  async function updateProfile(updates) {
    const { data } = await api.put('/auth/profile', updates);
    user.value = data.user;
    return data.user;
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('astin_token');
  }

  return {
    user, token, loading, isAuthenticated,
    register, login, fetchProfile, updateProfile, logout,
  };
});
