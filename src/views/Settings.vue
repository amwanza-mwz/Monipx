<template>
  <div class="container-fluid">
    <h1 class="mt-4 mb-4">{{ $t('settings.title') }}</h1>
    
    <div class="row">
      <div class="col-md-6 mb-3">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">{{ $t('settings.theme') }}</h5>
            <button class="btn btn-primary" @click="toggleTheme">
              {{ theme === 'light' ? $t('settings.darkMode') : $t('settings.lightMode') }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="col-md-6 mb-3">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">{{ $t('settings.language') }}</h5>
            <select class="form-select" v-model="currentLocale" @change="changeLanguage">
              <option value="en">{{ $t('settings.english') }}</option>
              <option value="fr">{{ $t('settings.french') }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useThemeStore } from '../stores/theme';
import { useLocaleStore } from '../stores/locale';

export default {
  name: 'Settings',
  setup() {
    const themeStore = useThemeStore();
    const localeStore = useLocaleStore();
    
    const theme = computed(() => themeStore.theme);
    const currentLocale = computed({
      get: () => localeStore.currentLocale,
      set: (value) => localeStore.setLocale(value),
    });

    function toggleTheme() {
      themeStore.toggleTheme();
    }

    function changeLanguage(event) {
      localeStore.setLocale(event.target.value);
    }

    return {
      theme,
      currentLocale,
      toggleTheme,
      changeLanguage,
    };
  },
};
</script>

