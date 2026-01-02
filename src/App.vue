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
    const theme = computed(() => themeStore.theme);
    const showNavbar = ref(true);
    const needsSetup = ref(false);
    const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true');

    // Provide sidebar state to all child components
    provide('sidebarCollapsed', sidebarCollapsed);

    // Hide layout on login and setup pages
    const showLayout = computed(() => {
      return route.path !== '/login' && route.path !== '/setup';
    });

    async function checkSetup() {
      try {
        const response = await api.get('/auth/setup-status');
        if (response.data.needs_setup && route.path !== '/setup') {
          needsSetup.value = true;
          router.push('/setup');
        }
      } catch (error) {
        console.error('Failed to check setup status:', error);
      }
    }

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
      checkSetup();
      showNavbar.value = route.path !== '/setup';

      // Listen for sidebar toggle events
      window.addEventListener('sidebar-toggle', handleSidebarToggle);

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
