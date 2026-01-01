<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <div class="sidebar-brand" v-if="!isCollapsed">
        <img src="/assets/images/logo.png" alt="Monipx" class="sidebar-logo" />
        <h4 class="mb-0 sidebar-title">Monipx</h4>
      </div>
      <div class="sidebar-brand-collapsed" v-else>
        <img src="/assets/images/logo.png" alt="Monipx" class="sidebar-logo-small" />
      </div>
      <button class="sidebar-toggle" @click="toggleCollapse" :title="isCollapsed ? 'Expand' : 'Collapse'">
        <i :class="isCollapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left'"></i>
      </button>
    </div>

    <nav class="sidebar-nav">
      <router-link to="/" class="nav-item" :title="$t('nav.dashboard')">
        <div class="nav-icon">
          <i class="bi bi-speedometer2"></i>
        </div>
        <span v-if="!isCollapsed" class="nav-text">{{ $t('nav.dashboard') }}</span>
      </router-link>
      <router-link to="/subnets" class="nav-item" :title="$t('nav.subnets')">
        <div class="nav-icon">
          <i class="bi bi-diagram-3-fill"></i>
        </div>
        <span v-if="!isCollapsed" class="nav-text">{{ $t('nav.subnets') }}</span>
      </router-link>
      <router-link to="/monitoring" class="nav-item" :title="$t('nav.monitoring')">
        <div class="nav-icon">
          <i class="bi bi-activity"></i>
        </div>
        <span v-if="!isCollapsed" class="nav-text">{{ $t('nav.monitoring') }}</span>
      </router-link>
    </nav>
    <div class="sidebar-footer">
      <div class="user-dropdown" :class="{ 'dropdown-open': showUserDropdown }">
        <button class="user-menu-button" @click="toggleUserDropdown" v-if="currentUser">
          <div class="nav-icon">
            <i class="bi bi-person-circle"></i>
          </div>
          <span v-if="!isCollapsed" class="nav-text">{{ currentUser.username || 'User' }}</span>
          <i v-if="!isCollapsed" class="bi bi-chevron-down ms-auto dropdown-arrow"></i>
        </button>
        <div class="user-dropdown-menu" v-if="showUserDropdown && !isCollapsed">
          <router-link to="/settings" class="dropdown-item" @click="showUserDropdown = false">
            <i class="bi bi-gear me-2"></i>Settings
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useThemeStore } from '../stores/theme';
import api from '../services/api';

export default {
  name: 'Sidebar',
  setup() {
    const themeStore = useThemeStore();
    const theme = computed(() => themeStore.theme);
    const isCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true');
    const currentUser = ref(null);
    const showUserDropdown = ref(false);

    async function loadUser() {
      try {
        const response = await api.get('/auth/me');
        currentUser.value = response.data;
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    }

    function toggleCollapse() {
      isCollapsed.value = !isCollapsed.value;
      localStorage.setItem('sidebarCollapsed', isCollapsed.value.toString());
      window.dispatchEvent(new Event('storage'));
      if (isCollapsed.value) {
        showUserDropdown.value = false;
      }
    }

    function toggleUserDropdown() {
      showUserDropdown.value = !showUserDropdown.value;
    }

    function handleClickOutside(event) {
      if (!event.target.closest('.user-dropdown')) {
        showUserDropdown.value = false;
      }
    }

    onMounted(() => {
      loadUser();
      document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    return {
      isCollapsed,
      theme,
      currentUser,
      showUserDropdown,
      toggleCollapse,
      toggleUserDropdown,
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
  background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  transition: width 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 1.25rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 80px;
  background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.sidebar-brand-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.sidebar-logo {
  height: 50px;
  width: auto;
  object-fit: contain;
}

.sidebar-logo-small {
  height: 42px;
  width: auto;
  object-fit: contain;
}

.sidebar-title {
  font-weight: 700;
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: -0.5px;
  color: var(--primary) !important;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: #c9d1d9;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.sidebar-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ff2667;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.875rem 1.5rem;
  color: #8b949e;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 1rem;
  margin: 0.25rem 0.75rem;
  border-radius: 12px;
  position: relative;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  transition: all 0.3s ease;
  background-color: transparent;
}

.nav-item i {
  font-size: 1.25rem;
  transition: transform 0.3s ease;
}

.nav-text {
  font-weight: 500;
  font-size: 0.95rem;
}

.nav-item:hover {
  background-color: rgba(255, 38, 103, 0.15);
  color: #ff2667;
  transform: translateX(4px);
}

.nav-item:hover .nav-icon {
  background-color: rgba(255, 38, 103, 0.1);
  transform: scale(1.1);
}

.nav-item.router-link-active {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 38, 103, 0.3);
}

.nav-item.router-link-active .nav-icon {
  background-color: rgba(255, 255, 255, 0.2);
}

.nav-item.router-link-active:hover {
  transform: translateX(4px);
  box-shadow: 0 6px 16px rgba(255, 38, 103, 0.4);
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.875rem;
  margin: 0.25rem 0.5rem;
}

.sidebar.collapsed .nav-item .nav-text {
  display: none;
}

.sidebar.collapsed .nav-icon {
  width: 36px;
  height: 36px;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: #0d1117;
}

.user-dropdown {
  position: relative;
}

.user-menu-button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.875rem 1rem;
  background: #161b22;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #c9d1d9;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 1rem;
  text-align: left;
}

.user-menu-button:hover {
  background: rgba(255, 38, 103, 0.15);
  border-color: #ff2667;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 38, 103, 0.2);
  color: #ff2667;
}

.dropdown-arrow {
  transition: transform 0.3s ease;
  font-size: 0.875rem;
}

.user-dropdown.dropdown-open .dropdown-arrow {
  transform: rotate(180deg);
}

.user-dropdown-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 0.5rem;
  background: #161b22;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #c9d1d9;
  text-decoration: none;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background: rgba(255, 38, 103, 0.15);
  color: #ff2667;
}

.sidebar.collapsed .user-menu-button {
  justify-content: center;
  padding: 0.875rem;
}

.sidebar.collapsed .user-menu-button .nav-text,
.sidebar.collapsed .user-menu-button .dropdown-arrow {
  display: none;
}
</style>
