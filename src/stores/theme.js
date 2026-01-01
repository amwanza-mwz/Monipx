import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref('light');

  // Load theme from settings
  async function loadTheme() {
    try {
      const response = await api.get('/settings/theme');
      if (response.data && response.data.value) {
        theme.value = response.data.value;
        applyTheme(theme.value);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      applyTheme('light');
    }
  }

  // Set theme
  async function setTheme(newTheme) {
    theme.value = newTheme;
    applyTheme(newTheme);
    
    try {
      await api.put('/settings/theme', { theme: newTheme });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  // Toggle theme
  function toggleTheme() {
    const newTheme = theme.value === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }

  // Apply theme to document
  function applyTheme(themeValue) {
    document.documentElement.setAttribute('data-theme', themeValue);
    const app = document.getElementById('app');
    if (app) {
      app.setAttribute('data-theme', themeValue);
    }
  }

  // Initialize theme on load
  loadTheme();

  return {
    theme,
    setTheme,
    toggleTheme,
    loadTheme,
  };
});

