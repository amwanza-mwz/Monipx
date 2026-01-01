<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-5">
        <div class="card mt-5">
          <div class="card-body p-5">
            <div class="text-center mb-4">
              <h1 class="h3 mb-3" style="color: var(--primary)">Monipx</h1>
              <p class="text-muted">Create your admin account</p>
            </div>

            <form @submit.prevent="handleSetup">
              <div class="mb-3">
                <label class="form-label">Username *</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="formData.username"
                  required
                  placeholder="Enter username"
                />
              </div>

              <div class="mb-3">
                <label class="form-label">Email</label>
                <input
                  type="email"
                  class="form-control"
                  v-model="formData.email"
                  placeholder="Enter email (optional)"
                />
              </div>

              <div class="mb-3">
                <label class="form-label">Password *</label>
                <input
                  type="password"
                  class="form-control"
                  v-model="formData.password"
                  required
                  placeholder="Enter password"
                  minlength="6"
                />
              </div>

              <div class="mb-3">
                <label class="form-label">Confirm Password *</label>
                <input
                  type="password"
                  class="form-control"
                  v-model="formData.confirmPassword"
                  required
                  placeholder="Confirm password"
                  minlength="6"
                />
              </div>

              <div v-if="error" class="alert alert-danger">{{ error }}</div>

              <button type="submit" class="btn btn-primary w-100" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Create Admin Account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

export default {
  name: 'Setup',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const error = ref(null);
    const formData = ref({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });

    async function handleSetup() {
      error.value = null;

      if (formData.value.password !== formData.value.confirmPassword) {
        error.value = 'Passwords do not match';
        return;
      }

      if (formData.value.password.length < 6) {
        error.value = 'Password must be at least 6 characters';
        return;
      }

      loading.value = true;

      try {
        await api.post('/auth/setup', {
          username: formData.value.username,
          email: formData.value.email,
          password: formData.value.password,
        });

        // Redirect to login or dashboard
        router.push('/');
      } catch (err) {
        error.value = err.response?.data?.error || err.message || 'Setup failed';
      } finally {
        loading.value = false;
      }
    }

    return {
      formData,
      loading,
      error,
      handleSetup,
    };
  },
};
</script>

<style scoped>
.card {
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
</style>

