import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import i18n from './i18n';
import { useThemeStore } from './stores/theme';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './assets/styles/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);

// Load theme immediately before mounting
const themeStore = useThemeStore();

// Apply theme from localStorage immediately (before API call)
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.body.setAttribute('data-theme', savedTheme);
}

// Then load from database
themeStore.loadTheme().then(() => {
  const theme = themeStore.theme;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }
});

app.mount('#app');

