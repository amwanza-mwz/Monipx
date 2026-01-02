<template>
  <div class="topbar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <div class="topbar-content">
      <div class="topbar-left">
        <h5 class="topbar-title mb-0">{{ pageTitle }}</h5>
      </div>
      <div class="topbar-right">
        <!-- Update Notification -->
        <div class="notification-bell" v-if="updateAvailable">
          <a
            :href="githubReleasesUrl"
            target="_blank"
            class="notification-btn"
            title="Update Available!"
            @click="dismissNotification"
          >
            <i class="bi bi-bell-fill"></i>
            <span class="notification-badge"></span>
          </a>
          <div class="notification-tooltip">
            <strong>Update Available!</strong>
            <small>Version {{ latestVersion }} is ready</small>
            <small class="d-block mt-1 text-muted">Click to download</small>
          </div>
        </div>

        <!-- Theme Toggle -->
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
import { useUpdateStore } from '../stores/update';

export default {
  name: 'TopBar',
  setup() {
    const route = useRoute();
    const themeStore = useThemeStore();
    const updateStore = useUpdateStore();

    const theme = computed(() => themeStore.theme);
    const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true');
    const updateAvailable = computed(() => updateStore.updateAvailable);
    const latestVersion = computed(() => updateStore.latestVersion);
    const githubReleasesUrl = computed(() => updateStore.githubReleasesUrl);

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

    function dismissNotification() {
      // Dismiss the notification after a short delay (user sees it was clicked)
      setTimeout(() => {
        updateStore.dismissUpdate();
      }, 500);
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

      // Load cached update data and check for updates
      updateStore.loadCachedData();
      updateStore.checkForUpdates();

      // Check for updates every hour
      setInterval(() => {
        updateStore.checkForUpdates();
      }, 60 * 60 * 1000);
    });

    return {
      theme,
      pageTitle,
      toggleTheme,
      dismissNotification,
      sidebarCollapsed,
      updateAvailable,
      latestVersion,
      githubReleasesUrl,
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

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Notification Bell */
.notification-bell {
  position: relative;
}

.notification-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.25rem;
  text-decoration: none;
  position: relative;
  animation: bellRing 2s ease-in-out infinite;
}

@keyframes bellRing {
  0%, 100% {
    transform: rotate(0deg);
  }
  10%, 30% {
    transform: rotate(-10deg);
  }
  20%, 40% {
    transform: rotate(10deg);
  }
  50% {
    transform: rotate(0deg);
  }
}

.notification-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(255, 38, 103, 0.4);
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  background: #28a745;
  border-radius: 50%;
  border: 2px solid var(--card-bg);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.notification-tooltip {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: var(--card-bg);
  border: 2px solid var(--primary);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  box-shadow: var(--shadow-lg);
  min-width: 200px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1000;
}

.notification-bell:hover .notification-tooltip {
  opacity: 1;
  visibility: visible;
  top: calc(100% + 5px);
}

.notification-tooltip strong {
  display: block;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.notification-tooltip small {
  display: block;
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.notification-tooltip::before {
  content: '';
  position: absolute;
  top: -8px;
  right: 12px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid var(--primary);
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
