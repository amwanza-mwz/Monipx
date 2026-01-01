<template>
  <div class="topbar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <div class="topbar-content">
      <div class="topbar-left">
        <h5 class="topbar-title mb-0">{{ pageTitle }}</h5>
      </div>
      <div class="topbar-right">
        <button class="theme-toggle-topbar" @click="toggleTheme" :title="theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'">
          <i v-if="theme === 'light'" class="bi bi-moon-stars-fill"></i>
          <i v-else class="bi bi-sun-fill"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useThemeStore } from '../stores/theme';

export default {
  name: 'TopBar',
  setup() {
    const route = useRoute();
    const themeStore = useThemeStore();
    const theme = computed(() => themeStore.theme);
    const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true');

    const pageTitle = computed(() => {
      const titles = {
        '/': 'Dashboard',
        '/subnets': 'Subnets',
        '/monitoring': 'Monitoring',
        '/settings': 'Settings',
      };
      return titles[route.path] || 'Monipx';
    });

    function toggleTheme() {
      themeStore.toggleTheme();
    }

    onMounted(() => {
      // Listen for sidebar collapse changes
      const checkSidebar = () => {
        sidebarCollapsed.value = localStorage.getItem('sidebarCollapsed') === 'true';
      };
      
      window.addEventListener('storage', (e) => {
        if (e.key === 'sidebarCollapsed') {
          checkSidebar();
        }
      });

      // Also check periodically in case storage event doesn't fire
      setInterval(checkSidebar, 100);
    });

    return {
      theme,
      pageTitle,
      toggleTheme,
      sidebarCollapsed,
    };
  },
};
</script>

<style scoped>
.topbar {
  position: fixed;
  top: 0;
  left: 250px;
  right: 0;
  height: 60px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  z-index: 999;
  transition: left 0.3s ease;
}

.topbar.sidebar-collapsed {
  left: 60px;
}

.topbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 100%;
}

.topbar-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1.25rem;
}

.theme-toggle-topbar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.25rem;
}

.theme-toggle-topbar:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  transform: scale(1.1);
}

.theme-toggle-topbar i {
  display: block;
  font-family: "bootstrap-icons" !important;
}
</style>
