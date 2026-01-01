<template>
  <div class="container-fluid">
    <h2 class="mb-4">{{ $t('settings.title') }}</h2>
    
    <div class="row">
      <!-- User Settings -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-person-circle me-2"></i>User Account
            </h5>
          </div>
          <div class="card-body">
            <div v-if="loadingUser" class="text-center py-3">
              <div class="spinner-border spinner-border-sm" role="status"></div>
            </div>
            <form v-else @submit.prevent="updateUser">
              <div class="mb-3">
                <label for="username" class="form-label">Username</label>
                <input
                  type="text"
                  class="form-control"
                  id="username"
                  v-model="userForm.username"
                  required
                />
              </div>
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input
                  type="email"
                  class="form-control"
                  id="email"
                  v-model="userForm.email"
                />
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">New Password</label>
                <input
                  type="password"
                  class="form-control"
                  id="password"
                  v-model="userForm.password"
                  placeholder="Leave blank to keep current password"
                  minlength="6"
                />
                <small class="form-text text-muted">Minimum 6 characters</small>
              </div>
              <button type="submit" class="btn btn-primary" :disabled="savingUser">
                <span v-if="savingUser" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-check-circle me-2"></i>
                {{ savingUser ? 'Saving...' : 'Update User' }}
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Theme Settings -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-palette me-2"></i>{{ $t('settings.theme') }}
            </h5>
          </div>
          <div class="card-body">
            <button class="btn btn-primary" @click="toggleTheme">
              <i :class="theme === 'light' ? 'bi bi-moon-stars-fill me-2' : 'bi bi-sun-fill me-2'"></i>
              {{ theme === 'light' ? $t('settings.darkMode') : $t('settings.lightMode') }}
            </button>
            <p class="text-muted mt-3 mb-0">
              Current theme: <strong>{{ theme }}</strong>
            </p>
          </div>
        </div>
      </div>
      
      <!-- Language Settings -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-translate me-2"></i>{{ $t('settings.language') }}
            </h5>
          </div>
          <div class="card-body">
            <select class="form-select" v-model="currentLocale" @change="changeLanguage">
              <option value="en">{{ $t('settings.english') }}</option>
              <option value="fr">{{ $t('settings.french') }}</option>
            </select>
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
import api from '../services/api';

export default {
  name: 'Settings',
  setup() {
    const themeStore = useThemeStore();
    const localeStore = useLocaleStore();
    
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

    function toggleTheme() {
      themeStore.toggleTheme();
    }

    function changeLanguage(event) {
      localeStore.setLocale(event.target.value);
    }

    onMounted(() => {
      loadUser();
    });

    return {
      theme,
      currentLocale,
      userForm,
      loadingUser,
      savingUser,
      toggleTheme,
      changeLanguage,
      updateUser,
    };
  },
};
</script>
