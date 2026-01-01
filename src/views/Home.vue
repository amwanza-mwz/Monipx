<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="mb-1">{{ $t('dashboard.title') }}</h2>
            <p class="text-muted mb-0">Monitor and track your network infrastructure</p>
          </div>
          <button class="btn btn-primary" @click="refreshDashboard">
            <i class="bi bi-arrow-clockwise me-2"></i>Refresh
          </button>
        </div>

        <!-- Statistics Cards -->
        <div class="row g-3 mb-4">
          <div class="col-md-3">
            <div class="stat-card stat-card-primary">
              <div class="stat-card-content">
                <div class="stat-card-icon">
                  <i class="bi bi-diagram-3-fill"></i>
                </div>
                <div class="stat-card-info">
                  <h6 class="stat-card-label">{{ $t('dashboard.totalSubnets') }}</h6>
                  <h2 class="stat-card-value">{{ dashboardData.total_subnets || 0 }}</h2>
                </div>
              </div>
              <div class="stat-card-footer">
                <small class="text-muted">Active subnets</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card stat-card-info">
              <div class="stat-card-content">
                <div class="stat-card-icon">
                  <i class="bi bi-hdd-network-fill"></i>
                </div>
                <div class="stat-card-info">
                  <h6 class="stat-card-label">{{ $t('dashboard.totalIPs') }}</h6>
                  <h2 class="stat-card-value">{{ dashboardData.total_ips || 0 }}</h2>
                </div>
              </div>
              <div class="stat-card-footer">
                <small class="text-muted">Total IP addresses</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card stat-card-success">
              <div class="stat-card-content">
                <div class="stat-card-icon">
                  <i class="bi bi-check-circle-fill"></i>
                </div>
                <div class="stat-card-info">
                  <h6 class="stat-card-label">{{ $t('dashboard.connectedIPs') }}</h6>
                  <h2 class="stat-card-value">{{ dashboardData.connected_ips || 0 }}</h2>
                </div>
              </div>
              <div class="stat-card-footer">
                <small class="text-muted">Currently connected</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card stat-card-warning">
              <div class="stat-card-content">
                <div class="stat-card-icon">
                  <i class="bi bi-activity"></i>
                </div>
                <div class="stat-card-info">
                  <h6 class="stat-card-label">{{ $t('dashboard.activeMonitors') }}</h6>
                  <h2 class="stat-card-value">{{ dashboardData.active_monitors || 0 }}</h2>
                </div>
              </div>
              <div class="stat-card-footer">
                <small class="text-muted">Active monitors</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Subnet Tracking Cards -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h4 class="mb-0">Subnet Tracking</h4>
              <router-link to="/subnets" class="btn btn-sm btn-outline-primary">
                View All <i class="bi bi-arrow-right ms-1"></i>
              </router-link>
            </div>
            <div v-if="loadingSubnets" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <div v-else-if="subnets.length === 0" class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              No subnets found. <router-link to="/subnets">Add your first subnet</router-link> to start tracking.
            </div>
            <div v-else class="row g-3">
              <div class="col-md-6 col-lg-4" v-for="subnet in subnets" :key="subnet.id">
                <div class="subnet-track-card">
                  <div class="subnet-track-header">
                    <div class="subnet-track-title">
                      <h5 class="mb-0">{{ subnet.name }}</h5>
                      <code class="subnet-cidr">{{ subnet.subnet }}</code>
                    </div>
                    <div class="subnet-track-status" :class="getHealthClass(subnet.statistics?.health_percentage)">
                      <div class="health-indicator"></div>
                    </div>
                  </div>
                  <div class="subnet-track-body">
                    <div class="subnet-stats-row">
                      <div class="subnet-stat-item">
                        <div class="subnet-stat-value text-success">{{ subnet.statistics?.connected || 0 }}</div>
                        <div class="subnet-stat-label">Connected</div>
                      </div>
                      <div class="subnet-stat-item">
                        <div class="subnet-stat-value text-danger">{{ subnet.statistics?.disconnected || 0 }}</div>
                        <div class="subnet-stat-label">Disconnected</div>
                      </div>
                      <div class="subnet-stat-item">
                        <div class="subnet-stat-value text-muted">{{ subnet.statistics?.unknown || 0 }}</div>
                        <div class="subnet-stat-label">Unknown</div>
                      </div>
                    </div>
                    <div class="subnet-progress">
                      <div class="progress" style="height: 8px;">
                        <div 
                          class="progress-bar bg-success" 
                          :style="{ width: `${subnet.statistics?.health_percentage || 0}%` }"
                          role="progressbar"
                        ></div>
                      </div>
                      <div class="subnet-progress-text">
                        <span>Health: <strong>{{ subnet.statistics?.health_percentage || 0 }}%</strong></span>
                        <span>Total: {{ subnet.statistics?.total_ips || 0 }} IPs</span>
                      </div>
                    </div>
                  </div>
                  <div class="subnet-track-footer">
                    <router-link :to="`/subnets/${subnet.id}`" class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-eye me-1"></i>View Details
                    </router-link>
                    <button class="btn btn-sm btn-outline-secondary" @click="scanSubnet(subnet.id)">
                      <i class="bi bi-arrow-repeat me-1"></i>Scan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="row">
          <div class="col-12">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title mb-3">
                  <i class="bi bi-lightning-charge-fill me-2 text-warning"></i>
                  Quick Actions
                </h5>
                <div class="d-flex gap-2 flex-wrap">
                  <router-link to="/subnets" class="btn btn-primary">
                    <i class="bi bi-plus-circle me-2"></i>Add Subnet
                  </router-link>
                  <button class="btn btn-primary" @click="scanAllSubnets" :disabled="scanningAll">
                    <span v-if="scanningAll" class="spinner-border spinner-border-sm me-2"></span>
                    <i v-else class="bi bi-arrow-repeat me-2"></i>
                    {{ scanningAll ? 'Scanning...' : 'Scan All Subnets' }}
                  </button>
                  <router-link to="/monitoring" class="btn btn-outline-info">
                    <i class="bi bi-activity me-2"></i>View Monitors
                  </router-link>
                  <router-link to="/settings" class="btn btn-outline-secondary">
                    <i class="bi bi-gear me-2"></i>Settings
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

export default {
  name: 'Home',
  setup() {
    const router = useRouter();
    const dashboardData = ref({
      total_subnets: 0,
      total_ips: 0,
      connected_ips: 0,
      disconnected_ips: 0,
      active_monitors: 0,
      overall_uptime: 100,
    });
    const subnets = ref([]);
    const loadingSubnets = ref(true);
    const scanningAll = ref(false);

    async function loadDashboard() {
      try {
        const response = await api.get('/status/dashboard');
        dashboardData.value = response.data;
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      }
    }

    async function loadSubnets() {
      try {
        loadingSubnets.value = true;
        const response = await api.get('/subnets');
        const subnetList = response.data;
        
        // Load statistics for each subnet
        for (const subnet of subnetList) {
          try {
            const statsResponse = await api.get(`/subnets/${subnet.id}/statistics`);
            subnet.statistics = statsResponse.data.statistics || {
              total_ips: 0,
              connected: 0,
              disconnected: 0,
              unknown: 0,
              health_percentage: 0,
            };
          } catch (err) {
            console.error(`Failed to load stats for subnet ${subnet.id}:`, err);
            subnet.statistics = {
              total_ips: 0,
              connected: 0,
              disconnected: 0,
              unknown: 0,
              health_percentage: 0,
            };
          }
        }
        
        subnets.value = subnetList.slice(0, 6); // Show first 6 subnets
      } catch (error) {
        console.error('Failed to load subnets:', error);
      } finally {
        loadingSubnets.value = false;
      }
    }

    function getHealthClass(percentage) {
      if (percentage >= 80) return 'health-excellent';
      if (percentage >= 60) return 'health-good';
      if (percentage >= 40) return 'health-warning';
      return 'health-critical';
    }

    async function scanSubnet(subnetId) {
      try {
        const response = await api.post(`/subnets/${subnetId}/scan`);
        console.log('Scan initiated:', response.data);
        // Reload after a delay to see results
        setTimeout(() => {
          loadSubnets();
          loadDashboard();
        }, 2000);
      } catch (error) {
        console.error('Failed to scan subnet:', error);
        alert(error.response?.data?.error || 'Failed to scan subnet');
      }
    }

    async function scanAllSubnets() {
      scanningAll.value = true;
      try {
        await api.post('/subnets/scan-all');
        setTimeout(() => {
          loadSubnets();
          loadDashboard();
          scanningAll.value = false;
        }, 3000);
      } catch (error) {
        console.error('Failed to scan all subnets:', error);
        alert(error.response?.data?.error || 'Failed to scan all subnets');
        scanningAll.value = false;
      }
    }

    function refreshDashboard() {
      loadDashboard();
      loadSubnets();
    }

    onMounted(() => {
      loadDashboard();
      loadSubnets();
    });

    return {
      dashboardData,
      subnets,
      loadingSubnets,
      scanningAll,
      getHealthClass,
      scanSubnet,
      scanAllSubnets,
      refreshDashboard,
    };
  },
};
</script>

<style scoped>
.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card-primary::before {
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
}

.stat-card-info::before {
  background: linear-gradient(90deg, var(--info) 0%, #4dd0e1 100%);
}

.stat-card-success::before {
  background: linear-gradient(90deg, var(--success) 0%, #66bb6a 100%);
}

.stat-card-warning::before {
  background: linear-gradient(90deg, var(--warning) 0%, #ffca28 100%);
}

.stat-card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.stat-card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: linear-gradient(135deg, rgba(255, 38, 103, 0.1) 0%, rgba(255, 38, 103, 0.05) 100%);
  color: var(--primary);
}

.stat-card-info {
  flex: 1;
  text-align: right;
}

.stat-card-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-card-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
  color: var(--text-primary);
}

.stat-card-footer {
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

/* Subnet Track Cards */
.subnet-track-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.subnet-track-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--primary);
}

.subnet-track-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.subnet-track-title h5 {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.subnet-cidr {
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.subnet-track-status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: relative;
}

.health-indicator {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.health-excellent .health-indicator {
  background-color: var(--success);
  box-shadow: 0 0 8px var(--success);
}

.health-good .health-indicator {
  background-color: #4caf50;
  box-shadow: 0 0 8px #4caf50;
}

.health-warning .health-indicator {
  background-color: var(--warning);
  box-shadow: 0 0 8px var(--warning);
}

.health-critical .health-indicator {
  background-color: var(--danger);
  box-shadow: 0 0 8px var(--danger);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.subnet-track-body {
  flex: 1;
  margin-bottom: 1.25rem;
}

.subnet-stats-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 1rem;
}

.subnet-stat-item {
  text-align: center;
}

.subnet-stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.subnet-stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.subnet-progress {
  margin-top: 1rem;
}

.subnet-progress-text {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.subnet-track-footer {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.subnet-track-footer .btn {
  flex: 1;
}
</style>
