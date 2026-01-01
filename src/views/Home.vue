<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <h2 class="mb-4">{{ $t('dashboard.title') }}</h2>
        <div class="row g-3 mb-4">
          <div class="col-md-3">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="card-subtitle mb-2 text-muted">{{ $t('dashboard.totalSubnets') }}</h6>
                    <h2 class="mb-0">{{ dashboardData.total_subnets || 0 }}</h2>
                  </div>
                  <div class="text-primary" style="font-size: 2.5rem;">
                    <i class="bi bi-diagram-3"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="card-subtitle mb-2 text-muted">{{ $t('dashboard.totalIPs') }}</h6>
                    <h2 class="mb-0">{{ dashboardData.total_ips || 0 }}</h2>
                  </div>
                  <div class="text-info" style="font-size: 2.5rem;">
                    <i class="bi bi-hdd-network"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="card-subtitle mb-2 text-muted">{{ $t('dashboard.connectedIPs') }}</h6>
                    <h2 class="mb-0 text-success">{{ dashboardData.connected_ips || 0 }}</h2>
                  </div>
                  <div class="text-success" style="font-size: 2.5rem;">
                    <i class="bi bi-check-circle"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="card-subtitle mb-2 text-muted">{{ $t('dashboard.activeMonitors') }}</h6>
                    <h2 class="mb-0">{{ dashboardData.active_monitors || 0 }}</h2>
                  </div>
                  <div class="text-warning" style="font-size: 2.5rem;">
                    <i class="bi bi-activity"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="alert alert-info mt-4">
          <strong>{{ $t('dashboard.welcome') }}</strong> {{ $t('dashboard.welcomeMessage') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import api from '../services/api';

export default {
  name: 'Home',
  setup() {
    const dashboardData = ref({
      total_subnets: 0,
      total_ips: 0,
      connected_ips: 0,
      disconnected_ips: 0,
      active_monitors: 0,
      overall_uptime: 100,
    });

    async function loadDashboard() {
      try {
        const response = await api.get('/status/dashboard');
        dashboardData.value = response.data;
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      }
    }

    onMounted(() => {
      loadDashboard();
    });

    return {
      dashboardData,
    };
  },
};
</script>

