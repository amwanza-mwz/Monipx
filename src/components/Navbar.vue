<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid">
      <router-link class="navbar-brand" to="/">
        {{ $t('app.name') }}
      </router-link>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/">
              {{ $t('nav.dashboard') }}
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/subnets">
              {{ $t('nav.subnets') }}
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/monitoring">
              {{ $t('nav.monitoring') }}
            </router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/settings">
              {{ $t('nav.settings') }}
            </router-link>
          </li>
        </ul>
        <div class="d-flex align-items-center">
          <button class="btn btn-sm btn-outline-light me-2" @click="toggleTheme">
            <span v-if="theme === 'light'">🌙</span>
            <span v-else>☀️</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { computed } from 'vue';
import { useThemeStore } from '../stores/theme';

export default {
  name: 'Navbar',
  setup() {
    const themeStore = useThemeStore();
    const theme = computed(() => themeStore.theme);

    function toggleTheme() {
      themeStore.toggleTheme();
    }

    return {
      theme,
      toggleTheme,
    };
  },
};
</script>

<style scoped>
.navbar-brand {
  font-weight: bold;
}
</style>

