<template>
  <div id="app" :data-theme="theme">
    <template v-if="showLayout">
      <Sidebar />
      <TopBar />
      <div class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <router-view />
      </div>
    </template>
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<script>
import { computed, ref, onMounted, watch, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useThemeStore } from './stores/theme';
import { useUpdateStore } from './stores/update';
import Sidebar from './components/Sidebar.vue';
import TopBar from './components/TopBar.vue';
import api from './services/api';

export default {
  name: 'App',
  components: {
    Sidebar,
    TopBar,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const themeStore = useThemeStore();
    const updateStore = useUpdateStore();
    const theme = computed(() => themeStore.theme);
    const showNavbar = ref(true);
    const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true');
    const isAuthValid = ref(false);
    const authChecked = ref(false);

    // Provide sidebar state to all child components
    provide('sidebarCollapsed', sidebarCollapsed);

    // Hide layout on login, setup, and terminal pages
    const showLayout = computed(() => {
      const isAuthPage = route.path === '/login' || route.path === '/setup';
      const isTerminalPage = route.path === '/secure-terminal';

      // Never show layout on auth pages or terminal page
      if (isAuthPage || isTerminalPage) {
        return false;
      }

      // Only show layout if auth is validated
      return isAuthValid.value && authChecked.value;
    });

    watch(() => route.path, (newPath) => {
      showNavbar.value = newPath !== '/setup';
    }, { immediate: true });

    // Watch for theme changes and apply immediately
    watch(() => themeStore.theme, (newTheme) => {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', newTheme);
        document.documentElement.setAttribute('data-bs-theme', newTheme); // Bootstrap 5.3+ dark mode
        document.body.setAttribute('data-theme', newTheme);
        const app = document.getElementById('app');
        if (app) {
          app.setAttribute('data-theme', newTheme);
        }
      }
    }, { immediate: true });

    // Listen for custom sidebar toggle event
    const handleSidebarToggle = (event) => {
      sidebarCollapsed.value = event.detail.collapsed;
    };

    onMounted(async () => {
      showNavbar.value = route.path !== '/setup';

      // Listen for sidebar toggle events
      window.addEventListener('sidebar-toggle', handleSidebarToggle);

      // Validate authentication on app load
      const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
      if (storedAuth) {
        try {
          // Verify session is still valid with server
          await api.get('/auth/me');
          isAuthValid.value = true;
        } catch (error) {
          console.error('Session invalid, logging out:', error);
          // Clear auth state and redirect to login
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('user');
          isAuthValid.value = false;
          if (route.path !== '/login' && route.path !== '/setup') {
            router.push('/login');
          }
        }
      } else {
        isAuthValid.value = false;
        // Redirect to login if not on auth pages
        if (route.path !== '/login' && route.path !== '/setup') {
          router.push('/login');
        }
      }
      authChecked.value = true;

      // Ensure theme is applied immediately
      const currentTheme = themeStore.theme;
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', currentTheme);
        document.documentElement.setAttribute('data-bs-theme', currentTheme);
        document.body.setAttribute('data-theme', currentTheme);
        const app = document.getElementById('app');
        if (app) {
          app.setAttribute('data-theme', currentTheme);
        }
      }

      // Load current version from API
      try {
        await updateStore.loadCurrentVersion();
      } catch (error) {
        console.error('Failed to load current version:', error);
      }

      // Load theme from database
      try {
        await themeStore.loadTheme();
        // Re-apply after loading
        const updatedTheme = themeStore.theme;
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', updatedTheme);
          document.documentElement.setAttribute('data-bs-theme', updatedTheme);
          document.body.setAttribute('data-theme', updatedTheme);
          const app = document.getElementById('app');
          if (app) {
            app.setAttribute('data-theme', updatedTheme);
          }
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    });

    return {
      theme,
      showNavbar,
      showLayout,
      sidebarCollapsed,
    };
  },
};
</script>

<style>
#app {
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
</style>
