import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';

const VIEWING_KEY = 'astin_viewing_patient';
const CONTEXT_CHOSEN_KEY = 'astin_data_context_chosen';

function loadViewingPatient() {
  const raw = localStorage.getItem(VIEWING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('astin_token'));
  const loading = ref(false);
  const viewingPatient = ref(loadViewingPatient());
  const viewablePatients = ref([]);
  const pendingInvites = ref([]);
  const viewers = ref([]);
  const dataContextChosen = ref(localStorage.getItem(CONTEXT_CHOSEN_KEY) === '1');

  const isAuthenticated = computed(() => !!token.value);
  const isGuardian = computed(() => user.value?.accountType === 'guardian');
  const needsDataChoice = computed(() => isGuardian.value && !dataContextChosen.value);
  const canWrite = computed(() => !viewingPatient.value);
  const isViewingOther = computed(() => !!viewingPatient.value);

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
    if (u?.accountType === 'guardian') {
      resetDataContext();
    }
  }

  function markDataContextChosen() {
    dataContextChosen.value = true;
    localStorage.setItem(CONTEXT_CHOSEN_KEY, '1');
  }

  function confirmOwnData() {
    setViewingPatient(null);
    markDataContextChosen();
  }

  function confirmPatientData(patient) {
    setViewingPatient(patient);
    markDataContextChosen();
  }

  function resetDataContext() {
    dataContextChosen.value = false;
    localStorage.removeItem(CONTEXT_CHOSEN_KEY);
    setViewingPatient(null);
  }

  function openDataChooser() {
    resetDataContext();
  }

  function setViewingPatient(patient) {
    viewingPatient.value = patient;
    if (patient) {
      localStorage.setItem(VIEWING_KEY, JSON.stringify(patient));
    } else {
      localStorage.removeItem(VIEWING_KEY);
    }
  }

  function viewOwnData() {
    setViewingPatient(null);
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

  async function fetchViewablePatients() {
    const { data } = await api.get('/care/patients');
    viewablePatients.value = data.patients;
    if (viewingPatient.value && !data.patients.some((p) => p.id === viewingPatient.value.id)) {
      setViewingPatient(null);
    }
    return data.patients;
  }

  async function fetchViewers() {
    const { data } = await api.get('/care/viewers');
    viewers.value = data.viewers;
    return data.viewers;
  }

  async function inviteViewer(email, displayName) {
    const { data } = await api.post('/care/viewers', { email, displayName });
    await fetchViewers();
    return data.viewer;
  }

  async function revokeViewer(id) {
    await api.delete(`/care/viewers/${id}`);
    await fetchViewers();
  }

  async function fetchInvites() {
    const { data } = await api.get('/care/invites');
    pendingInvites.value = data.invites;
    return data.invites;
  }

  async function acceptInvite(id) {
    await api.post(`/care/invites/${id}/accept`);
    await Promise.all([fetchInvites(), fetchViewablePatients()]);
  }

  async function loadCareData() {
    await Promise.all([fetchViewablePatients(), fetchInvites()]);
  }

  function logout() {
    token.value = null;
    user.value = null;
    viewingPatient.value = null;
    viewablePatients.value = [];
    pendingInvites.value = [];
    viewers.value = [];
    dataContextChosen.value = false;
    localStorage.removeItem('astin_token');
    localStorage.removeItem(VIEWING_KEY);
    localStorage.removeItem(CONTEXT_CHOSEN_KEY);
  }

  return {
    user, token, loading, viewingPatient, viewablePatients, pendingInvites, viewers,
    dataContextChosen, isAuthenticated, isGuardian, needsDataChoice, canWrite, isViewingOther,
    register, login, fetchProfile, updateProfile, logout,
    setViewingPatient, viewOwnData, confirmOwnData, confirmPatientData, resetDataContext, openDataChooser,
    fetchViewablePatients, fetchViewers, inviteViewer, revokeViewer,
    fetchInvites, acceptInvite, loadCareData,
  };
});
