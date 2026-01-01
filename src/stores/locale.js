import { defineStore } from 'pinia';
import { ref } from 'vue';
import { i18n } from '../i18n';
import api from '../services/api';

export const useLocaleStore = defineStore('locale', () => {
  const savedLocale = localStorage.getItem('locale') || 'en';
  const currentLocale = ref(savedLocale);

  // Load locale from settings
  async function loadLocale() {
    try {
      const response = await api.get('/settings/locale');
      if (response.data && response.data.value) {
        setLocale(response.data.value);
      } else {
        // Set default if not in settings
        i18n.global.locale.value = savedLocale;
      }
    } catch (error) {
      console.error('Failed to load locale:', error);
      i18n.global.locale.value = savedLocale;
    }
  }

  // Set locale
  async function setLocale(newLocale) {
    currentLocale.value = newLocale;
    i18n.global.locale.value = newLocale;
    localStorage.setItem('locale', newLocale);
    
    try {
      await api.put('/settings/locale', { value: newLocale });
    } catch (error) {
      console.error('Failed to save locale:', error);
    }
  }

  // Initialize locale on load
  loadLocale();

  return {
    currentLocale,
    setLocale,
    loadLocale,
  };
});

