<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useAlert } from '../composables/useAlert';

const router = useRouter();
const auth = useAuthStore();
const alert = useAlert();
const form = ref({
  fullName: '',
  email: '',
  password: '',
  diabetesType: 'type_2',
});

async function submit() {
  try {
    await auth.register(form.value);
    alert.success('Account created!', 'Welcome to Astin Diabetes System.', () => router.push('/'));
  } catch (e) {
    alert.error(e.response?.data?.error || 'Registration failed');
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-astin-900 to-slate-900">
    <div class="w-full max-w-md card p-8">
      <h1 class="text-2xl font-bold text-center mb-6">Create account</h1>
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="text-sm text-slate-500">Full name</label>
          <input v-model="form.fullName" required class="input-field mt-1" />
        </div>
        <div>
          <label class="text-sm text-slate-500">Email</label>
          <input v-model="form.email" type="email" required class="input-field mt-1" />
        </div>
        <div>
          <label class="text-sm text-slate-500">Password (min 8)</label>
          <input v-model="form.password" type="password" minlength="8" required class="input-field mt-1" />
        </div>
        <div>
          <label class="text-sm text-slate-500">Diabetes type</label>
          <select v-model="form.diabetesType" class="input-field mt-1">
            <option value="type_1">Type 1</option>
            <option value="type_1_5">Type 1.5 (LADA)</option>
            <option value="type_2">Type 2</option>
            <option value="gestational">Gestational</option>
          </select>
        </div>
        <button type="submit" class="btn-primary w-full" :disabled="auth.loading">Register</button>
      </form>
      <p class="text-center text-sm mt-6 text-slate-500">
        Have an account? <RouterLink to="/login" class="text-astin-600 hover:underline">Sign in</RouterLink>
      </p>
    </div>
  </div>
</template>
