import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref('light');
  
  // Apply theme to document
  function applyTheme(themeValue) {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      html.setAttribute('data-theme', themeValue);
      
      const app = document.getElementById('app');
      if (app) {
        app.setAttribute('data-theme', themeValue);
      }
      
      // Also apply to body
      document.body.setAttribute('data-theme', themeValue);
    }
  }

  // Load theme from database first, then localStorage fallback
  async function loadTheme() {
    try {
      // First try database
      const response = await api.get('/settings/theme');
      if (response.data && response.data.value && (response.data.value === 'light' || response.data.value === 'dark')) {
        const dbTheme = response.data.value;
        theme.value = dbTheme;
        applyTheme(dbTheme);
        // Sync localStorage with database
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('theme', dbTheme);
        }
        console.log('✅ Theme loaded from database:', dbTheme);
        return;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load theme from database, using localStorage:', error.message);
    }

    // Fallback to localStorage
    try {
      const localTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
      if (localTheme && (localTheme === 'light' || localTheme === 'dark')) {
        theme.value = localTheme;
        applyTheme(localTheme);
        // Save to database (but don't wait for it)
        api.put('/settings/theme', { theme: localTheme }).catch(err => {
          console.warn('Failed to sync theme to database:', err.message);
        });
        console.log('✅ Theme loaded from localStorage:', localTheme);
      } else {
        // Default to light only if nothing is saved
        theme.value = 'light';
        applyTheme('light');
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('theme', 'light');
        }
        // Save to database (but don't wait for it)
        api.put('/settings/theme', { theme: 'light' }).catch(err => {
          console.warn('Failed to save default theme:', err.message);
        });
        console.log('✅ Theme set to default: light');
      }
    } catch (error) {
      console.error('❌ Failed to load theme from localStorage:', error);
      theme.value = 'light';
      applyTheme('light');
    }
  }

  // Set theme
  async function setTheme(newTheme) {
    theme.value = newTheme;
    applyTheme(newTheme);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    
    try {
      const response = await api.put('/settings/theme', { theme: newTheme });
      console.log('✅ Theme saved to database:', response.data);
    } catch (error) {
      console.error('❌ Failed to save theme to database:', error);
      // Still keep it in localStorage even if DB save fails
    }
  }

  // Toggle theme
  function toggleTheme() {
    const newTheme = theme.value === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }

  // Initialize - load theme immediately from localStorage for instant display
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      theme.value = savedTheme;
      applyTheme(savedTheme);
      console.log('✅ Theme initialized from localStorage:', savedTheme);
    } else {
      // No localStorage, apply default immediately
      theme.value = 'light';
      applyTheme('light');
      if (localStorage) {
        localStorage.setItem('theme', 'light');
      }
    }
    
    // Then load from database (this will override if different)
    // Don't await - let it happen in background
    loadTheme().catch(err => {
      console.error('Failed to load theme from database:', err);
    });
  }

  return {
    theme,
    setTheme,
    toggleTheme,
    loadTheme,
  };
});

