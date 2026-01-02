<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <img src="/assets/images/logo.png" alt="Monipx Logo" class="login-logo" />
        <h1 class="login-title">Monipx</h1>
        <p class="login-subtitle">Network Monitoring & IP Management</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">Username</label>
          <div class="input-group">
            <span class="input-icon">
              <i class="bi bi-person"></i>
            </span>
            <input
              type="text"
              class="form-control"
              v-model="formData.username"
              required
              placeholder="Enter your username"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="input-group">
            <span class="input-icon">
              <i class="bi bi-lock"></i>
            </span>
            <input
              type="password"
              class="form-control"
              v-model="formData.password"
              required
              placeholder="Enter your password"
              autocomplete="current-password"
            />
          </div>
        </div>

        <div v-if="error" class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
        </div>

        <button type="submit" class="btn btn-primary btn-login" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-box-arrow-in-right me-2"></i>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="login-footer">
        <p class="text-muted">
          <i class="bi bi-shield-check me-1"></i>
          Secure login
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

export default {
  name: 'Login',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const error = ref(null);

    const formData = ref({
      username: '',
      password: '',
    });

    async function handleLogin() {
      error.value = null;
      loading.value = true;

      try {
        const response = await api.post('/auth/login', {
          username: formData.value.username,
          password: formData.value.password,
        });

        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('isAuthenticated', 'true');

        // Redirect to home
        router.push('/');
      } catch (err) {
        error.value = err.response?.data?.error || err.message || 'Login failed';
      } finally {
        loading.value = false;
      }
    }

    return {
      formData,
      loading,
      error,
      handleLogin,
    };
  },
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 3rem;
  width: 100%;
  max-width: 450px;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.login-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: #6c757d;
  font-size: 0.95rem;
  margin: 0;
}

.login-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.input-group {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  z-index: 10;
  pointer-events: none;
}

.input-group .form-control {
  padding-left: 3rem;
  height: 48px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.input-group .form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.15);
}

.btn-login {
  width: 100%;
  height: 48px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.alert {
  border-radius: 8px;
  margin-bottom: 1rem;
}

.login-footer {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.login-footer p {
  margin: 0;
  font-size: 0.875rem;
}

/* Dark mode support */
[data-theme='dark'] .login-card {
  background: #1a1d23;
  color: #e6e8eb;
}

[data-theme='dark'] .login-title {
  color: #e6e8eb;
}

[data-theme='dark'] .form-label {
  color: #c9d1d9;
}

[data-theme='dark'] .input-group .form-control {
  background: #0d1117;
  border-color: #30363d;
  color: #e6e8eb;
}

[data-theme='dark'] .input-group .form-control:focus {
  border-color: #667eea;
  background: #161b22;
}

[data-theme='dark'] .login-footer {
  border-top-color: #30363d;
}

</style>

