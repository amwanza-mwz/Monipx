import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import api from '../services/api';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/setup',
    name: 'Setup',
    component: () => import('../views/Setup.vue'),
    meta: { requiresGuest: true, hideLayout: true },
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true },
  },
  {
    path: '/subnets',
    name: 'Subnets',
    component: () => import('../views/Subnets.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/subnets/:id',
    name: 'SubnetDetail',
    component: () => import('../views/SubnetDetail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/monitoring',
    name: 'Monitoring',
    component: () => import('../views/Monitoring.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/monitoring/:id',
    name: 'MonitorDetail',
    component: () => import('../views/MonitorDetail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/secure-terminal',
    name: 'SecureTerminal',
    component: () => import('../views/SecureTerminal.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsNew.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  // Check if setup is needed
  try {
    const response = await api.get('/auth/setup-status');
    const { needs_setup } = response.data;

    // If setup is needed and not going to setup page, redirect to setup
    if (needs_setup && to.path !== '/setup') {
      return next('/setup');
    }

    // If setup is complete and going to setup page, redirect to login or home
    if (!needs_setup && to.path === '/setup') {
      return next(isAuthenticated ? '/' : '/login');
    }
  } catch (error) {
    console.error('Failed to check setup status:', error);
    // If API fails, assume setup is needed and allow navigation to setup page
    // This prevents the app from being stuck
    if (to.path === '/setup') {
      return next();
    }
    // If we can't check setup status, try to proceed but allow setup page
    if (to.path !== '/setup' && to.path !== '/login') {
      // If not authenticated and not on auth pages, redirect to login
      if (!isAuthenticated) {
        return next('/login');
      }
    }
  }

  // Check authentication requirements
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login');
  }

  if (to.meta.requiresGuest && isAuthenticated) {
    return next('/');
  }

  next();
});

export default router;

