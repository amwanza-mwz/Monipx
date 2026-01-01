<template>
  <div id="app" :data-theme="theme">
    <Sidebar />
    <TopBar />
    <div class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <router-view />
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, watch } from 'vue';
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
        document.body.setAttribute('data-theme', newTheme);
        const app = document.getElementById('app');
        if (app) {
          app.setAttribute('data-theme', newTheme);
        }
      }
    }, { immediate: true });

    // Listen for sidebar collapse events
    window.addEventListener('storage', (e) => {
      if (e.key === 'sidebarCollapsed') {
        sidebarCollapsed.value = e.newValue === 'true';
      }
    });

    onMounted(async () => {
      checkSetup();
      showNavbar.value = route.path !== '/setup';
      
      // Ensure theme is applied immediately
      const currentTheme = themeStore.theme;
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', currentTheme);
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
