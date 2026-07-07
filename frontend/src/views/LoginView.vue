<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useAlert } from '../composables/useAlert';

const router = useRouter();
const auth = useAuthStore();
const alert = useAlert();
const form = ref({ email: '', password: '' });

async function submit() {
  try {
    await auth.login(form.value);
    alert.success('Welcome back!', 'You are now signed in.', () => router.push('/'));
  } catch (e) {
    alert.error(e.response?.data?.error || 'Login failed');
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-astin-900 to-slate-900">
    <div class="w-full max-w-md card p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-astin-400 to-astin-700 flex items-center justify-center text-white text-2xl font-bold mb-4">A</div>
        <h1 class="text-2xl font-bold">Astin Diabetes</h1>
        <p class="text-slate-500 text-sm mt-1">Sign in to your account</p>
      </div>
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="text-sm text-slate-500">Email</label>
          <input v-model="form.email" type="email" required class="input-field mt-1" />
        </div>
        <div>
          <label class="text-sm text-slate-500">Password</label>
          <input v-model="form.password" type="password" required class="input-field mt-1" />
        </div>
        <button type="submit" class="btn-primary w-full" :disabled="auth.loading">Sign in</button>
      </form>
      <p class="text-center text-sm mt-6 text-slate-500">
        No account? <RouterLink to="/register" class="text-astin-600 hover:underline">Register</RouterLink>
      </p>
    </div>
  </div>
</template>
