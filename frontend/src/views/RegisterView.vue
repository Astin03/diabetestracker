<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useAlert } from '../composables/useAlert';
import AppLogo from '../components/common/AppLogo.vue';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const alert = useAlert();
const form = ref({
  fullName: '',
  email: '',
  password: '',
  diabetesType: 'type_2',
  accountType: 'patient',
});

onMounted(() => {
  if (route.query.type === 'guardian') form.value.accountType = 'guardian';
});

async function submit() {
  try {
    await auth.register(form.value);
    if (form.value.accountType === 'guardian') {
      await auth.loadCareData();
      alert.success('Guardian account created!', 'Choose whose data you want to view.', () => router.push('/choose-data'));
    } else {
      alert.success('Account created!', 'Welcome to Astin Diabetes System.', () => router.push('/'));
    }
  } catch (e) {
    alert.error(e.response?.data?.error || 'Registration failed');
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-astin-900 to-slate-900">
    <div class="w-full max-w-md card p-8">
      <div class="text-center mb-6">
        <AppLogo size="xl" centered class="mb-4" />
        <p class="text-sm text-slate-500">Who is this account for?</p>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          class="p-4 rounded-2xl border-2 text-left transition"
          :class="form.accountType === 'patient'
            ? 'border-astin-600 bg-astin-50 dark:bg-astin-900/30'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'"
          @click="form.accountType = 'patient'"
        >
          <i class="ph-duotone ph-user text-2xl text-astin-600 mb-2 block"></i>
          <p class="font-semibold text-sm">Patient</p>
          <p class="text-xs text-slate-500 mt-1">I track my own diabetes</p>
        </button>
        <button
          type="button"
          class="p-4 rounded-2xl border-2 text-left transition"
          :class="form.accountType === 'guardian'
            ? 'border-astin-600 bg-astin-50 dark:bg-astin-900/30'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'"
          @click="form.accountType = 'guardian'"
        >
          <i class="ph-duotone ph-users-three text-2xl text-indigo-600 mb-2 block"></i>
          <p class="font-semibold text-sm">Guardian</p>
          <p class="text-xs text-slate-500 mt-1">I monitor a relative (view only)</p>
        </button>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="text-sm text-slate-500">Full name</label>
          <input v-model="form.fullName" required class="input-field mt-1" />
        </div>
        <div>
          <label class="text-sm text-slate-500">Email</label>
          <input v-model="form.email" type="email" required class="input-field mt-1" />
          <p v-if="form.accountType === 'guardian'" class="text-xs text-slate-500 mt-1">
            Use the same email your family member invited.
          </p>
        </div>
        <div>
          <label class="text-sm text-slate-500">Password (min 8)</label>
          <input v-model="form.password" type="password" minlength="8" required class="input-field mt-1" />
        </div>
        <div v-if="form.accountType === 'patient'">
          <label class="text-sm text-slate-500">Diabetes type</label>
          <select v-model="form.diabetesType" class="input-field mt-1">
            <option value="type_1">Type 1</option>
            <option value="type_1_5">Type 1.5 (LADA)</option>
            <option value="type_2">Type 2</option>
            <option value="gestational">Gestational</option>
          </select>
        </div>
        <div
          v-else
          class="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 p-3 text-sm text-indigo-900 dark:text-indigo-100"
        >
          <i class="ph-duotone ph-info mr-1"></i>
          Guardians can view glucose, medications, and logs but cannot add or edit data.
        </div>
        <button type="submit" class="btn-primary w-full" :disabled="auth.loading">
          {{ form.accountType === 'guardian' ? 'Create guardian account' : 'Create account' }}
        </button>
      </form>
      <p class="text-center text-sm mt-6 text-slate-500">
        Have an account? <RouterLink to="/login" class="text-astin-600 hover:underline">Sign in</RouterLink>
      </p>
    </div>
  </div>
</template>
