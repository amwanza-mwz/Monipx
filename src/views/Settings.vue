<template>
  <div class="container-fluid settings-page">
    <!-- Header -->
    <div class="settings-header">
      <div>
        <h2 class="mb-1">
          <i class="bi bi-gear-fill me-2"></i>
          {{ $t('settings.title') }}
        </h2>
        <p class="text-muted mb-0">Manage your application preferences and account</p>
      </div>
    </div>

    <!-- Settings Grid -->
    <div class="settings-grid">
      <!-- User Account Card -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-card-icon bg-primary">
            <i class="bi bi-person-circle"></i>
          </div>
          <div>
            <h5 class="mb-0">User Account</h5>
            <small class="text-muted">Manage your profile and credentials</small>
          </div>
        </div>
        <div class="settings-card-body">
          <div v-if="loadingUser" class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
          </div>
          <form v-else @submit.prevent="updateUser">
            <div class="form-group-modern">
              <label for="username" class="form-label">
                <i class="bi bi-person me-2"></i>Username
              </label>
              <input
                type="text"
                class="form-control"
                id="username"
                v-model="userForm.username"
                required
              />
            </div>
            <div class="form-group-modern">
              <label for="email" class="form-label">
                <i class="bi bi-envelope me-2"></i>Email Address
              </label>
              <input
                type="email"
                class="form-control"
                id="email"
                v-model="userForm.email"
                placeholder="your@email.com"
              />
            </div>
            <div class="form-group-modern">
              <label for="password" class="form-label">
                <i class="bi bi-lock me-2"></i>New Password
              </label>
              <input
                type="password"
                class="form-control"
                id="password"
                v-model="userForm.password"
                placeholder="Leave blank to keep current password"
                minlength="6"
              />
              <small class="form-text text-muted">
                <i class="bi bi-info-circle me-1"></i>
                Minimum 6 characters
              </small>
            </div>
            <button type="submit" class="btn btn-primary btn-modern" :disabled="savingUser">
              <span v-if="savingUser" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-check-circle me-2"></i>
              {{ savingUser ? 'Saving...' : 'Update Account' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Appearance Card -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-card-icon bg-warning">
            <i class="bi bi-palette"></i>
          </div>
          <div>
            <h5 class="mb-0">Appearance</h5>
            <small class="text-muted">Customize your visual experience</small>
          </div>
        </div>
        <div class="settings-card-body">
          <div class="theme-selector">
            <div class="theme-option" :class="{ active: theme === 'light' }" @click="setTheme('light')">
              <div class="theme-preview theme-preview-light">
                <i class="bi bi-sun-fill"></i>
              </div>
              <div class="theme-info">
                <strong>Light Mode</strong>
                <small>Bright and clean interface</small>
              </div>
              <div class="theme-check" v-if="theme === 'light'">
                <i class="bi bi-check-circle-fill"></i>
              </div>
            </div>
            <div class="theme-option" :class="{ active: theme === 'dark' }" @click="setTheme('dark')">
              <div class="theme-preview theme-preview-dark">
                <i class="bi bi-moon-stars-fill"></i>
              </div>
              <div class="theme-info">
                <strong>Dark Mode</strong>
                <small>Easy on the eyes</small>
              </div>
              <div class="theme-check" v-if="theme === 'dark'">
                <i class="bi bi-check-circle-fill"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Language Card -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-card-icon bg-info">
            <i class="bi bi-translate"></i>
          </div>
          <div>
            <h5 class="mb-0">Language</h5>
            <small class="text-muted">Choose your preferred language</small>
          </div>
        </div>
        <div class="settings-card-body">
          <select class="form-select form-select-modern" v-model="currentLocale" @change="changeLanguage">
            <option value="en">🇬🇧 English</option>
            <option value="fr">🇫🇷 Français</option>
          </select>
        </div>
      </div>

      <!-- System Info & Updates Card -->
      <div class="settings-card settings-card-full">
        <div class="settings-card-header">
          <div class="settings-card-icon bg-success">
            <i class="bi bi-info-circle"></i>
          </div>
          <div>
            <h5 class="mb-0">System Information</h5>
            <small class="text-muted">Application version and updates</small>
          </div>
        </div>
        <div class="settings-card-body">
          <div class="system-info-grid">
            <div class="info-item">
              <div class="info-label">
                <i class="bi bi-app-indicator me-2"></i>
                Application
              </div>
              <div class="info-value">Monipx</div>
            </div>
            <div class="info-item">
              <div class="info-label">
                <i class="bi bi-tag me-2"></i>
                Current Version
              </div>
              <div class="info-value">{{ currentVersion }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">
                <i class="bi bi-cloud-download me-2"></i>
                Latest Version
              </div>
              <div class="info-value">
                <span v-if="checkingUpdate" class="spinner-border spinner-border-sm"></span>
                <span v-else>{{ latestVersion || 'Checking...' }}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">
                <i class="bi bi-calendar-check me-2"></i>
                Last Checked
              </div>
              <div class="info-value">{{ lastUpdateCheck }}</div>
            </div>
          </div>

          <div class="update-actions mt-4">
            <button class="btn btn-outline-primary" @click="checkForUpdates" :disabled="checkingUpdate">
              <span v-if="checkingUpdate" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-arrow-clockwise me-2"></i>
              Check for Updates
            </button>
            <a v-if="updateAvailable"
               :href="githubReleasesUrl"
               target="_blank"
               class="btn btn-success">
              <i class="bi bi-download me-2"></i>
              Download Update
            </a>
          </div>

          <div v-if="updateAvailable" class="alert alert-success mt-3">
            <i class="bi bi-exclamation-circle me-2"></i>
            <strong>Update Available!</strong> Version {{ latestVersion }} is now available.
          </div>
          <div v-else-if="!checkingUpdate && latestVersion" class="alert alert-info mt-3">
            <i class="bi bi-check-circle me-2"></i>
            You're running the latest version!
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useThemeStore } from '../stores/theme';
import { useLocaleStore } from '../stores/locale';
import { useUpdateStore } from '../stores/update';
import api from '../services/api';

export default {
  name: 'Settings',
  setup() {
    const themeStore = useThemeStore();
    const localeStore = useLocaleStore();
    const updateStore = useUpdateStore();

    const theme = computed(() => themeStore.theme);
    const currentLocale = computed({
      get: () => localeStore.currentLocale,
      set: (value) => localeStore.setLocale(value),
    });

    const userForm = ref({
      username: '',
      email: '',
      password: '',
    });
    const loadingUser = ref(true);
    const savingUser = ref(false);

    // Update checker - use store
    const currentVersion = computed(() => updateStore.currentVersion);
    const latestVersion = computed(() => updateStore.latestVersion);
    const checkingUpdate = computed(() => updateStore.checking);
    const updateAvailable = computed(() => updateStore.updateAvailable);
    const githubReleasesUrl = computed(() => updateStore.githubReleasesUrl);
    const lastUpdateCheck = computed(() => {
      if (!updateStore.lastCheck) return 'Never';
      return new Date(updateStore.lastCheck).toLocaleString();
    });

    async function loadUser() {
      try {
        loadingUser.value = true;
        const response = await api.get('/auth/me');
        userForm.value = {
          username: response.data.username || '',
          email: response.data.email || '',
          password: '',
        };
      } catch (error) {
        console.error('Failed to load user:', error);
        alert('Failed to load user information');
      } finally {
        loadingUser.value = false;
      }
    }

    async function updateUser() {
      try {
        savingUser.value = true;
        const updateData = {
          username: userForm.value.username,
          email: userForm.value.email,
        };

        // Only include password if provided
        if (userForm.value.password && userForm.value.password.length > 0) {
          if (userForm.value.password.length < 6) {
            alert('Password must be at least 6 characters');
            savingUser.value = false;
            return;
          }
          updateData.password = userForm.value.password;
        }

        await api.put('/auth/me', updateData);
        alert('User updated successfully!');
        userForm.value.password = ''; // Clear password field
        await loadUser(); // Reload to get updated info
      } catch (error) {
        console.error('Failed to update user:', error);
        alert(error.response?.data?.error || 'Failed to update user');
      } finally {
        savingUser.value = false;
      }
    }

    async function checkForUpdates() {
      await updateStore.checkForUpdates();
    }

    function setTheme(newTheme) {
      themeStore.setTheme(newTheme);
    }

    function toggleTheme() {
      themeStore.toggleTheme();
    }

    function changeLanguage(event) {
      localeStore.setLocale(event.target.value);
    }

    onMounted(() => {
      loadUser();

      // Load cached update info and check for updates
      updateStore.loadCachedData();
      checkForUpdates();
    });

    return {
      theme,
      currentLocale,
      userForm,
      loadingUser,
      savingUser,
      currentVersion,
      latestVersion,
      checkingUpdate,
      updateAvailable,
      githubReleasesUrl,
      lastUpdateCheck,
      setTheme,
      toggleTheme,
      changeLanguage,
      updateUser,
      checkForUpdates,
    };
  },
};
</script>

<style scoped>
.settings-page {
  padding: 2rem 0;
  max-width: 1400px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-header h2 {
  color: var(--text-primary);
  font-weight: 700;
  display: flex;
  align-items: center;
}

.settings-header h2 i {
  color: var(--primary);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.settings-card {
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: all 0.3s ease;
}

.settings-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.settings-card-full {
  grid-column: 1 / -1;
}

.settings-card-header {
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.settings-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.settings-card-icon.bg-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
}

.settings-card-icon.bg-warning {
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
}

.settings-card-icon.bg-info {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
}

.settings-card-icon.bg-success {
  background: linear-gradient(135deg, #28a745 0%, #218838 100%);
}

.settings-card-header h5 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

.settings-card-header small {
  color: var(--text-secondary);
}

.settings-card-body {
  padding: 1.5rem;
}

.form-group-modern {
  margin-bottom: 1.5rem;
}

.form-group-modern .form-label {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.form-group-modern .form-label i {
  color: var(--primary);
}

.form-group-modern .form-control {
  border-radius: 8px;
  border: 2px solid var(--border-color);
  padding: 0.75rem 1rem;
  transition: all 0.3s ease;
}

.form-group-modern .form-control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(255, 38, 103, 0.1);
}

.btn-modern {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 38, 103, 0.3);
}

/* Theme Selector */
.theme-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.theme-option:hover {
  border-color: var(--primary);
  background: var(--bg-secondary);
}

.theme-option.active {
  border-color: var(--primary);
  background: linear-gradient(135deg, rgba(255, 38, 103, 0.1) 0%, rgba(224, 30, 87, 0.05) 100%);
}

.theme-preview {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.theme-preview-light {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  color: #212529;
  border: 2px solid #dee2e6;
}

.theme-preview-dark {
  background: linear-gradient(135deg, #212529 0%, #343a40 100%);
  color: #ffffff;
  border: 2px solid #495057;
}

.theme-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.theme-info strong {
  color: var(--text-primary);
  font-size: 1rem;
}

.theme-info small {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.theme-check {
  color: var(--primary);
  font-size: 1.5rem;
}

/* Form Select Modern */
.form-select-modern {
  border-radius: 8px;
  border: 2px solid var(--border-color);
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-select-modern:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(255, 38, 103, 0.1);
}

/* System Info Grid */
.system-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-item {
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 2px solid var(--border-color);
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.info-label i {
  color: var(--primary);
}

.info-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

.update-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .system-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
