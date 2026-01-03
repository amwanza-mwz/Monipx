import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useSidebarStore = defineStore('sidebar', () => {
  const isCollapsed = ref(false);

  // Load sidebar state from database first, then localStorage fallback
  async function loadSidebarState() {
    try {
      // First try database
      const response = await api.get('/settings/sidebar_collapsed');
      if (response.data && response.data.value !== null && response.data.value !== undefined) {
        const dbState = response.data.value === 'true' || response.data.value === true;
        isCollapsed.value = dbState;
        // Sync localStorage with database
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('sidebarCollapsed', dbState.toString());
        }
        console.log('✅ Sidebar state loaded from database:', dbState);
        return;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load sidebar state from database, using localStorage:', error.message);
    }

    // Fallback to localStorage
    try {
      const localState = typeof localStorage !== 'undefined' ? localStorage.getItem('sidebarCollapsed') : null;
      if (localState !== null) {
        const state = localState === 'true';
        isCollapsed.value = state;
        // Save to database (but don't wait for it)
        api.put('/settings/sidebar_collapsed', { value: state.toString() }).catch(err => {
          console.warn('Failed to sync sidebar state to database:', err.message);
        });
        console.log('✅ Sidebar state loaded from localStorage:', state);
      } else {
        // Default to expanded (false)
        isCollapsed.value = false;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('sidebarCollapsed', 'false');
        }
      }
    } catch (error) {
      console.error('Failed to load sidebar state:', error);
      isCollapsed.value = false;
    }
  }

  // Set sidebar state
  async function setSidebarState(collapsed) {
    isCollapsed.value = collapsed;
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', collapsed.toString());
    }
    
    try {
      const response = await api.put('/settings/sidebar_collapsed', { value: collapsed.toString() });
      console.log('✅ Sidebar state saved to database:', response.data);
    } catch (error) {
      console.error('❌ Failed to save sidebar state to database:', error);
      // Still keep it in localStorage even if DB save fails
    }

    // Dispatch custom event for immediate update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sidebar-toggle', {
        detail: { collapsed }
      }));
    }
  }

  // Toggle sidebar
  function toggleSidebar() {
    setSidebarState(!isCollapsed.value);
  }

  // Initialize - load state immediately from localStorage for instant display
  if (typeof window !== 'undefined') {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      isCollapsed.value = savedState === 'true';
      console.log('✅ Sidebar state initialized from localStorage:', isCollapsed.value);
    } else {
      // No localStorage, apply default immediately
      isCollapsed.value = false;
      if (localStorage) {
        localStorage.setItem('sidebarCollapsed', 'false');
      }
    }
    
    // Then load from database (this will override if different)
    // Don't await - let it happen in background
    loadSidebarState().catch(err => {
      console.error('Failed to load sidebar state from database:', err);
    });
  }

  return {
    isCollapsed,
    loadSidebarState,
    setSidebarState,
    toggleSidebar,
  };
});

