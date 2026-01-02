<template>
  <div class="settings-page-new">
    <!-- Modern Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <i class="bi bi-gear-fill me-3"></i>
            Settings
          </h1>
          <p class="page-subtitle">Manage your application preferences and configuration</p>
        </div>
      </div>
    </div>

    <div class="settings-layout">
      <!-- Settings Sidebar -->
      <div class="settings-sidebar">
        <nav class="settings-nav">
          <button
            v-for="section in sections"
            :key="section.id"
            :class="['nav-item', { active: activeSection === section.id }]"
            @click="activeSection = section.id"
          >
            <i :class="`bi ${section.icon}`"></i>
            <span>{{ $t(`settings.sections.${section.id}`) }}</span>
          </button>
        </nav>
      </div>

      <!-- Settings Content -->
      <div class="settings-content">
        <!-- General Section -->
        <div v-show="activeSection === 'general'" class="settings-section">
          <h2 class="section-title">{{ $t('settings.sections.general') }}</h2>
          
          <!-- Server Timezone -->
          <div class="setting-group">
            <h3 class="setting-label">{{ $t('settings.general.serverTimezone') }}</h3>
            <select class="form-select" v-model="selectedTimezone" @change="updateTimezone">
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Europe/Paris">Paris (CET/CEST)</option>
              <option value="Europe/Berlin">Berlin (CET/CEST)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Shanghai">Shanghai (CST)</option>
              <option value="Australia/Sydney">Sydney (AEDT/AEST)</option>
              <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
            </select>
            <small class="form-text">
              <i class="bi bi-info-circle me-1"></i>
              {{ $t('settings.general.currentTime') }}: {{ currentServerTime }}
            </small>
          </div>
        </div>

        <!-- Appearance Section -->
        <div v-show="activeSection === 'appearance'" class="settings-section">
          <h2 class="section-title">{{ $t('settings.sections.appearance') }}</h2>
          
          <!-- Theme -->
          <div class="setting-group">
            <h3 class="setting-label">{{ $t('settings.appearance.theme') }}</h3>
            <div class="theme-selector">
              <button
                :class="['theme-option', { active: theme === 'light' }]"
                @click="setTheme('light')"
              >
                <i class="bi bi-sun-fill"></i>
                <span>{{ $t('settings.appearance.light') }}</span>
              </button>
              <button
                :class="['theme-option', { active: theme === 'dark' }]"
                @click="setTheme('dark')"
              >
                <i class="bi bi-moon-fill"></i>
                <span>{{ $t('settings.appearance.dark') }}</span>
              </button>
            </div>
          </div>

          <!-- Language -->
          <div class="setting-group">
            <h3 class="setting-label">{{ $t('settings.appearance.language') }}</h3>
            <select class="form-select" v-model="currentLocale">
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>

        <!-- Security Section -->
        <div v-show="activeSection === 'security'" class="settings-section">
          <h2 class="section-title">{{ $t('settings.sections.security') }}</h2>
          
          <!-- User Account -->
          <div class="setting-group">
            <h3 class="setting-label">{{ $t('settings.security.account') }}</h3>
            <div v-if="loadingUser" class="text-center py-4">
              <div class="spinner-border text-primary"></div>
            </div>
            <form v-else @submit.prevent="updateUser" class="account-form">
              <div class="form-group">
                <label>
                  <i class="bi bi-person me-2"></i>{{ $t('settings.security.username') }}
                </label>
                <input type="text" class="form-control" v-model="userForm.username" required />
              </div>
              <div class="form-group">
                <label>
                  <i class="bi bi-envelope me-2"></i>{{ $t('settings.security.email') }}
                </label>
                <input type="email" class="form-control" v-model="userForm.email" />
              </div>
              <div class="form-group">
                <label>
                  <i class="bi bi-lock me-2"></i>{{ $t('settings.security.newPassword') }}
                </label>
                <input type="password" class="form-control" v-model="userForm.password" placeholder="Leave blank to keep current" />
              </div>
              <button type="submit" class="btn btn-primary" :disabled="savingUser">
                <span v-if="savingUser" class="spinner-border spinner-border-sm me-2"></span>
                {{ $t('settings.security.saveChanges') }}
              </button>
            </form>
          </div>

          <!-- Two Factor Authentication -->
          <div class="setting-group">
            <h3 class="setting-label">{{ $t('settings.security.twoFactor') }}</h3>
            <div v-if="!twoFactorEnabled" class="twofa-disabled">
              <p class="text-muted">
                <i class="bi bi-info-circle me-2"></i>
                {{ $t('settings.security.twoFactorDesc') }}
              </p>
              <button class="btn btn-primary" @click="showEnable2FA = true">
                <i class="bi bi-shield-check me-2"></i>
                {{ $t('settings.security.enable2FA') }}
              </button>
            </div>
            <div v-else class="twofa-enabled">
              <div class="alert alert-success">
                <i class="bi bi-check-circle me-2"></i>
                {{ $t('settings.security.twoFactorEnabled') }}
              </div>
              <button class="btn btn-outline-danger" @click="disable2FA">
                <i class="bi bi-shield-x me-2"></i>
                {{ $t('settings.security.disable2FA') }}
              </button>
            </div>
          </div>
        </div>

        <!-- About Section -->
        <div v-show="activeSection === 'about'" class="settings-section">
          <h2 class="section-title">{{ $t('settings.sections.about') }}</h2>

          <div class="about-content">
            <div class="about-logo">
              <i class="bi bi-diagram-3-fill"></i>
              <h3>Monipx</h3>
              <p class="text-muted">{{ $t('settings.about.subtitle') }}</p>
            </div>

            <div class="about-info">
              <div class="info-row">
                <span class="info-label">{{ $t('settings.about.version') }}</span>
                <span class="info-value">{{ currentVersion }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ $t('settings.about.latestVersion') }}</span>
                <span class="info-value">
                  <span v-if="checkingUpdate" class="spinner-border spinner-border-sm"></span>
                  <span v-else>{{ latestVersion || 'Checking...' }}</span>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ $t('settings.about.developer') }}</span>
                <span class="info-value">
                  Arnold Mwanza<br>
                  <small style="font-size: 0.75rem; color: var(--text-muted);">Technical Consulting Engineer</small><br>
                  <small style="font-size: 0.75rem; color: var(--text-muted);">Passionate about open-source</small>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ $t('settings.about.contact') }}</span>
                <span class="info-value">
                  <a href="mailto:arnold_mwanza@mwzconnect.com">arnold_mwanza@mwzconnect.com</a>
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">GitHub</span>
                <span class="info-value">
                  <a href="https://github.com/amwanza-mwz" target="_blank">@amwanza-mwz</a>
                </span>
              </div>
            </div>

            <div class="about-actions">
              <button class="btn btn-outline-primary" @click="checkForUpdates" :disabled="checkingUpdate">
                <i class="bi bi-arrow-clockwise me-2"></i>
                {{ $t('settings.about.checkUpdates') }}
              </button>
              <a v-if="updateAvailable" :href="githubReleasesUrl" target="_blank" class="btn btn-success">
                <i class="bi bi-download me-2"></i>
                {{ $t('settings.about.downloadUpdate') }}
              </a>
            </div>

            <div v-if="updateAvailable" class="alert alert-success mt-3">
              <i class="bi bi-exclamation-circle me-2"></i>
              {{ $t('settings.about.updateAvailable', { version: latestVersion }) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2FA Enable Modal -->
    <div v-if="showEnable2FA" class="modal-overlay" @click="showEnable2FA = false">
      <div class="modal-content-2fa" @click.stop>
        <div class="modal-header-2fa">
          <h5>
            <i class="bi bi-shield-lock me-2"></i>
            {{ $t('settings.security.enable2FA') }}
          </h5>
          <button class="btn-close-2fa" @click="showEnable2FA = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body-2fa">
          <div v-if="!twoFactorSetupComplete">
            <div class="setup-step">
              <h6>{{ $t('settings.security.step1') }}</h6>
              <p class="text-muted">{{ $t('settings.security.scanQR') }}</p>
              <div class="qr-code-container">
                <div v-if="loadingQR" class="spinner-border text-primary"></div>
                <img v-else-if="qrCodeUrl" :src="qrCodeUrl" alt="2FA QR Code" class="qr-code-image" />
              </div>
              <div class="manual-entry">
                <small class="text-muted">{{ $t('settings.security.manualEntry') }}</small>
                <div class="secret-code">{{ twoFactorSecret }}</div>
              </div>
            </div>

            <div class="setup-step">
              <h6>{{ $t('settings.security.step2') }}</h6>
              <p class="text-muted">{{ $t('settings.security.enterCode') }}</p>
              <input
                type="text"
                class="form-control text-center verification-input"
                v-model="verificationCode"
                placeholder="000000"
                maxlength="6"
                @input="verificationCode = verificationCode.replace(/\D/g, '')"
              />
            </div>

            <div class="modal-actions">
              <button class="btn btn-secondary" @click="showEnable2FA = false">
                {{ $t('common.cancel') }}
              </button>
              <button class="btn btn-primary" @click="verify2FA" :disabled="verificationCode.length !== 6">
                <i class="bi bi-check-circle me-2"></i>
                {{ $t('settings.security.verifyEnable') }}
              </button>
            </div>
          </div>
          <div v-else class="text-center py-4">
            <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
            <h5 class="mt-3">{{ $t('settings.security.2faSuccess') }}</h5>
            <button class="btn btn-primary mt-3" @click="showEnable2FA = false">
              {{ $t('common.done') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useThemeStore } from '../stores/theme';
import { useLocaleStore } from '../stores/locale';
import { useUpdateStore } from '../stores/update';
import api from '../services/api';

export default {
  name: 'SettingsNew',
  setup() {
    const { t } = useI18n();
    const themeStore = useThemeStore();
    const localeStore = useLocaleStore();
    const updateStore = useUpdateStore();

    const theme = computed(() => themeStore.theme);
    const currentLocale = computed({
      get: () => localeStore.currentLocale,
      set: (value) => localeStore.setLocale(value),
    });

    // Active section
    const activeSection = ref('general');

    // Sections
    const sections = ref([
      { id: 'general', icon: 'bi-sliders' },
      { id: 'appearance', icon: 'bi-palette' },
      { id: 'security', icon: 'bi-shield-lock' },
      { id: 'about', icon: 'bi-info-circle' },
    ]);

    // User form
    const userForm = ref({
      username: '',
      email: '',
      password: '',
    });
    const loadingUser = ref(true);
    const savingUser = ref(false);

    // Timezone
    const selectedTimezone = ref('UTC');
    const currentServerTime = ref('');

    // 2FA
    const twoFactorEnabled = ref(false);
    const showEnable2FA = ref(false);
    const twoFactorSetupComplete = ref(false);
    const loadingQR = ref(false);
    const qrCodeUrl = ref('');
    const twoFactorSecret = ref('');
    const verificationCode = ref('');

    // Update checker
    const currentVersion = computed(() => updateStore.currentVersion);
    const latestVersion = computed(() => updateStore.latestVersion);
    const checkingUpdate = computed(() => updateStore.checking);
    const updateAvailable = computed(() => updateStore.updateAvailable);
    const githubReleasesUrl = computed(() => updateStore.githubReleasesUrl);

    async function loadUser() {
      try {
        loadingUser.value = true;
        const response = await api.get('/auth/me');
        userForm.value.username = response.data.username;
        userForm.value.email = response.data.email || '';
      } catch (error) {
        console.error('Failed to load user:', error);
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

        if (userForm.value.password) {
          if (userForm.value.password.length < 6) {
            alert('Password must be at least 6 characters');
            savingUser.value = false;
            return;
          }
          updateData.password = userForm.value.password;
        }

        await api.put('/auth/me', updateData);
        alert('User updated successfully!');
        userForm.value.password = '';
        await loadUser();
      } catch (error) {
        console.error('Failed to update user:', error);
        alert(error.response?.data?.error || 'Failed to update user');
      } finally {
        savingUser.value = false;
      }
    }

    function updateServerTime() {
      const now = new Date();
      const options = {
        timeZone: selectedTimezone.value,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      currentServerTime.value = now.toLocaleString('en-US', options);
    }

    async function updateTimezone() {
      try {
        await api.put('/settings/timezone', { timezone: selectedTimezone.value });
        updateServerTime();
        alert('Timezone updated successfully!');
      } catch (error) {
        console.error('Failed to update timezone:', error);
        alert('Failed to update timezone');
      }
    }

    async function loadTimezone() {
      try {
        const response = await api.get('/settings/timezone');
        if (response.data && response.data.value) {
          selectedTimezone.value = response.data.value;
        }
        updateServerTime();
      } catch (error) {
        console.error('Failed to load timezone:', error);
      }
    }

    async function load2FAStatus() {
      try {
        const response = await api.get('/auth/2fa/status');
        twoFactorEnabled.value = response.data.enabled || false;
      } catch (error) {
        console.error('Failed to load 2FA status:', error);
      }
    }

    async function enable2FASetup() {
      try {
        loadingQR.value = true;
        const response = await api.post('/auth/2fa/setup');
        qrCodeUrl.value = response.data.qrCode;
        twoFactorSecret.value = response.data.secret;
        loadingQR.value = false;
      } catch (error) {
        console.error('Failed to setup 2FA:', error);
        alert('Failed to setup 2FA');
        loadingQR.value = false;
      }
    }

    async function verify2FA() {
      try {
        await api.post('/auth/2fa/verify', {
          token: verificationCode.value,
          secret: twoFactorSecret.value
        });
        twoFactorSetupComplete.value = true;
        twoFactorEnabled.value = true;
        verificationCode.value = '';
        setTimeout(() => {
          showEnable2FA.value = false;
          twoFactorSetupComplete.value = false;
        }, 2000);
      } catch (error) {
        console.error('Failed to verify 2FA:', error);
        alert(error.response?.data?.error || 'Invalid verification code. Please try again.');
      }
    }

    async function disable2FA() {
      if (!confirm('Are you sure you want to disable two-factor authentication?')) {
        return;
      }
      try {
        await api.post('/auth/2fa/disable');
        twoFactorEnabled.value = false;
        alert('Two-factor authentication disabled successfully!');
      } catch (error) {
        console.error('Failed to disable 2FA:', error);
        alert('Failed to disable 2FA');
      }
    }

    async function checkForUpdates() {
      await updateStore.checkForUpdates();
    }

    function setTheme(newTheme) {
      themeStore.setTheme(newTheme);
    }

    watch(showEnable2FA, (newValue) => {
      if (newValue && !qrCodeUrl.value) {
        enable2FASetup();
      }
    });

    onMounted(() => {
      loadUser();
      loadTimezone();
      load2FAStatus();
      updateStore.loadCachedData();
      checkForUpdates();
      setInterval(updateServerTime, 1000);
    });

    return {
      t,
      theme,
      currentLocale,
      activeSection,
      sections,
      userForm,
      loadingUser,
      savingUser,
      selectedTimezone,
      currentServerTime,
      twoFactorEnabled,
      showEnable2FA,
      twoFactorSetupComplete,
      loadingQR,
      qrCodeUrl,
      twoFactorSecret,
      verificationCode,
      currentVersion,
      latestVersion,
      checkingUpdate,
      updateAvailable,
      githubReleasesUrl,
      setTheme,
      updateUser,
      updateTimezone,
      verify2FA,
      disable2FA,
      checkForUpdates,
    };
  },
};
</script>

<style scoped>
.settings-page-new {
  padding: 0;
  min-height: 100vh;
  background: var(--bg-primary);
}

/* Modern Header */
.page-header {
  background: linear-gradient(135deg, #FF2667 0%, #d91e63 100%);
  padding: 2.5rem 3rem;
  margin-bottom: 0;
  box-shadow: 0 4px 20px rgba(255, 38, 103, 0.3);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 38, 103, 0.9) 0%, rgba(217, 30, 99, 0.9) 100%);
  z-index: 1;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.header-left {
  color: white;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff !important;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.page-title i {
  font-size: 1.75rem;
  color: #ffffff !important;
}

.page-subtitle {
  font-size: 1rem;
  color: #ffffff !important;
  margin: 0;
  font-weight: 400;
  opacity: 0.95;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.settings-layout {
  display: flex;
  min-height: calc(100vh - 180px);
}

/* Sidebar */
.settings-sidebar {
  width: 240px;
  background: var(--card-bg);
  border-right: 1px solid var(--border-color);
  padding: 1.5rem 0;
  flex-shrink: 0;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 1rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.nav-item i {
  font-size: 1.125rem;
  width: 20px;
}

.nav-item:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--primary);
  color: white;
  border-left: 3px solid var(--primary);
  padding-left: calc(1rem - 3px);
}

/* Content */
.settings-content {
  flex: 1;
  padding: 2.5rem;
  overflow-y: auto;
  max-width: 900px;
}

.settings-section {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2rem;
}

.setting-group {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.setting-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.form-select,
.form-control {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  transition: all 0.2s;
}

.form-select:focus,
.form-control:focus {
  background: var(--bg-primary);
  border-color: var(--primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 38, 103, 0.1);
}

.form-text {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* Theme Selector */
.theme-selector {
  display: flex;
  gap: 1rem;
}

.theme-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}

.theme-option i {
  font-size: 2rem;
}

.theme-option:hover {
  border-color: var(--primary);
  background: var(--bg-primary);
}

.theme-option.active {
  border-color: var(--primary);
  background: rgba(255, 38, 103, 0.1);
  color: var(--primary);
}

/* Account Form */
.account-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

/* About Section */
.about-content {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
}

.about-logo {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.about-logo i {
  font-size: 4rem;
  color: var(--primary);
  margin-bottom: 1rem;
}

.about-logo h3 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  font-weight: 600;
  color: var(--text-primary);
}

.info-value a {
  color: var(--primary);
  text-decoration: none;
}

.info-value a:hover {
  text-decoration: underline;
}

.about-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* 2FA Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-content-2fa {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header-2fa {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header-2fa h5 {
  margin: 0;
  color: var(--text-primary);
  font-weight: 600;
}

.btn-close-2fa {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-close-2fa:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body-2fa {
  padding: 1.5rem;
}

.setup-step {
  margin-bottom: 2rem;
}

.setup-step h6 {
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.qr-code-container {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  display: inline-block;
  margin-bottom: 1rem;
}

.qr-code-image {
  max-width: 200px;
  height: auto;
}

.manual-entry {
  text-align: center;
}

.secret-code {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  letter-spacing: 2px;
  margin-top: 0.5rem;
  color: var(--text-primary);
  user-select: all;
}

.verification-input {
  font-size: 1.5rem;
  letter-spacing: 0.5rem;
  font-weight: 600;
  max-width: 250px;
  margin: 0 auto;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 768px) {
  .settings-layout {
    flex-direction: column;
  }

  .settings-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }

  .settings-nav {
    flex-direction: row;
    overflow-x: auto;
    padding: 0 1rem;
  }

  .nav-item {
    flex-shrink: 0;
  }

  .settings-content {
    padding: 1.5rem;
  }

  .theme-selector {
    flex-direction: column;
  }
}
</style>

