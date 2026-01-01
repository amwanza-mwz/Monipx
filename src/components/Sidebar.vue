<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <div class="sidebar-brand" v-if="!isCollapsed">
        <h4 class="mb-0" style="color: var(--primary)">Monipx</h4>
      </div>
      <button class="sidebar-toggle" @click="toggleCollapse" :title="isCollapsed ? 'Expand' : 'Collapse'">
        <i :class="isCollapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left'"></i>
      </button>
    </div>
    <nav class="sidebar-nav">
      <router-link to="/" class="nav-item" :title="$t('nav.dashboard')">
        <i class="bi bi-speedometer2"></i>
        <span v-if="!isCollapsed">{{ $t('nav.dashboard') }}</span>
      </router-link>
      <router-link to="/subnets" class="nav-item" :title="$t('nav.subnets')">
        <i class="bi bi-diagram-3"></i>
        <span v-if="!isCollapsed">{{ $t('nav.subnets') }}</span>
      </router-link>
      <router-link to="/monitoring" class="nav-item" :title="$t('nav.monitoring')">
        <i class="bi bi-activity"></i>
        <span v-if="!isCollapsed">{{ $t('nav.monitoring') }}</span>
      </router-link>
      <router-link to="/settings" class="nav-item" :title="$t('nav.settings')">
        <i class="bi bi-gear"></i>
        <span v-if="!isCollapsed">{{ $t('nav.settings') }}</span>
      </router-link>
    </nav>
    <div class="sidebar-footer" v-if="!isCollapsed">
      <div class="theme-toggle">
        <button class="btn btn-sm btn-outline-secondary w-100" @click="toggleTheme">
          <i :class="theme === 'light' ? 'bi bi-moon' : 'bi bi-sun'"></i>
          {{ theme === 'light' ? $t('settings.darkMode') : $t('settings.lightMode') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useThemeStore } from '../stores/theme';

export default {
  name: 'Sidebar',
  setup() {
    const themeStore = useThemeStore();
    const theme = computed(() => themeStore.theme);
    const isCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true');

    function toggleCollapse() {
      isCollapsed.value = !isCollapsed.value;
      localStorage.setItem('sidebarCollapsed', isCollapsed.value.toString());
      // Dispatch event for App.vue to listen
      window.dispatchEvent(new Event('storage'));
    }

    function toggleTheme() {
      themeStore.toggleTheme();
    }

    return {
      isCollapsed,
      theme,
      toggleCollapse,
      toggleTheme,
    };
  },
};
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  width: 250px;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  transition: width 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  min-height: 60px;
}

.sidebar-brand h4 {
  font-weight: bold;
  margin: 0;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.sidebar-toggle:hover {
  background-color: var(--bg-secondary);
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  gap: 0.75rem;
}

.nav-item i {
  font-size: 1.2rem;
  width: 20px;
  text-align: center;
}

.nav-item:hover {
  background-color: var(--bg-secondary);
  color: var(--primary);
}

.nav-item.router-link-active {
  background-color: var(--primary);
  color: white;
  border-right: 3px solid var(--primary-dark);
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem;
}

.sidebar.collapsed .nav-item span {
  display: none;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

.theme-toggle button {
  border-color: var(--border-color);
  color: var(--text-primary);
}

.theme-toggle button:hover {
  background-color: var(--bg-secondary);
  border-color: var(--primary);
  color: var(--primary);
}
</style>

