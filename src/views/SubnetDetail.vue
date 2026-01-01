<template>
  <div class="container-fluid subnet-detail-page">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <button class="btn btn-sm btn-outline-secondary me-2" @click="$router.push('/subnets')">
          <i class="bi bi-arrow-left me-1"></i>{{ $t('common.back') }}
        </button>
        <h2 class="d-inline ms-2">{{ subnet?.name || $t('subnets.subnetDetails') }}</h2>
        <span class="badge bg-secondary ms-2" v-if="subnet"><code>{{ subnet.subnet }}</code></span>
      </div>
      <div>
        <button class="btn btn-outline-primary me-2" @click="showEditForm = true">
          <i class="bi bi-pencil me-1"></i>{{ $t('common.edit') }}
        </button>
        <button class="btn btn-primary" @click="scanSubnet" :disabled="scanning">
          <span v-if="scanning" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-arrow-repeat me-1"></i>
          {{ scanning ? $t('subnets.scanning') : $t('subnets.scan') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">{{ $t('common.loading') }}</span>
      </div>
    </div>

    <div v-else-if="!subnet" class="alert alert-danger">
      {{ $t('errors.notFound') }}
    </div>

    <div v-else>
      <!-- Subnet Information Card -->
      <div class="card mb-4 subnet-info-card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="bi bi-info-circle me-2"></i>{{ $t('subnets.subnetDetails') }}
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <div class="info-item mb-3">
                <label class="info-label">{{ $t('subnets.name') }}</label>
                <div class="info-value">{{ subnet.name }}</div>
              </div>
              <div class="info-item mb-3">
                <label class="info-label">{{ $t('subnets.subnet') }}</label>
                <div class="info-value"><code class="subnet-code">{{ subnet.subnet }}</code></div>
              </div>
              <div class="info-item mb-3" v-if="subnet.description">
                <label class="info-label">{{ $t('subnets.description') }}</label>
                <div class="info-value">{{ subnet.description }}</div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="stats-grid">
                <div class="stat-box stat-total">
                  <div class="stat-icon"><i class="bi bi-hdd-network"></i></div>
                  <div class="stat-content">
                    <div class="stat-label">{{ $t('subnets.totalIPs') }}</div>
                    <div class="stat-number">{{ stats.total_ips }}</div>
                  </div>
                </div>
                <div class="stat-box stat-connected">
                  <div class="stat-icon"><i class="bi bi-check-circle"></i></div>
                  <div class="stat-content">
                    <div class="stat-label">{{ $t('subnets.connected') }}</div>
                    <div class="stat-number text-success">{{ stats.connected }}</div>
                  </div>
                </div>
                <div class="stat-box stat-disconnected">
                  <div class="stat-icon"><i class="bi bi-x-circle"></i></div>
                  <div class="stat-content">
                    <div class="stat-label">{{ $t('subnets.disconnected') }}</div>
                    <div class="stat-number text-danger">{{ stats.disconnected }}</div>
                  </div>
                </div>
                <div class="stat-box stat-health">
                  <div class="stat-icon"><i class="bi bi-heart-pulse"></i></div>
                  <div class="stat-content">
                    <div class="stat-label">{{ $t('subnets.healthPercentage') }}</div>
                    <div class="stat-number" :class="getHealthColor(stats.health_percentage)">
                      {{ stats.health_percentage }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- IP Address List -->
      <div class="card ip-list-card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            <i class="bi bi-list-ul me-2"></i>
            {{ $t('ips.title') }} 
            <span class="badge bg-secondary ms-2">{{ filteredIPs.length }} / {{ stats.total_ips || 0 }}</span>
          </h5>
          <div class="input-group" style="width: 300px">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input
              type="text"
              class="form-control"
              v-model="searchQuery"
              :placeholder="$t('common.search')"
            />
          </div>
        </div>
        <div class="card-body">
          <div class="table-responsive" style="max-height: 600px; overflow-y: auto;">
            <table class="table table-hover table-sm">
              <thead class="table-header">
                <tr>
                  <th style="width: 120px">{{ $t('ips.ipAddress') }}</th>
                  <th style="width: 100px">{{ $t('ips.status') }}</th>
                  <th>{{ $t('ips.hostname') }}</th>
                  <th>{{ $t('ips.domain') }}</th>
                  <th>{{ $t('ips.subdomain') }}</th>
                  <th>{{ $t('ips.fullDomain') }}</th>
                  <th style="width: 100px">{{ $t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ip in filteredIPs" :key="ip.id" :class="getRowClass(ip.status)">
                  <td><code class="ip-address-code">{{ ip.ip_address }}</code></td>
                  <td>
                    <span
                      class="badge status-badge"
                      :class="{
                        'bg-success': ip.status === 'connected',
                        'bg-danger': ip.status === 'disconnected',
                        'bg-secondary': ip.status === 'unknown',
                      }"
                    >
                      <i :class="getStatusIcon(ip.status)" class="me-1"></i>
                      {{ $t(`ips.${ip.status}`) }}
                    </span>
                  </td>
                  <td>{{ ip.hostname || '-' }}</td>
                  <td>{{ ip.domain || '-' }}</td>
                  <td>{{ ip.subdomain || '-' }}</td>
                  <td>{{ ip.full_domain || '-' }}</td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary" @click="editIP(ip)" :title="$t('common.edit')">
                      <i class="bi bi-pencil"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="filteredIPs.length === 0" class="text-center py-4 text-muted">
              <i class="bi bi-inbox" style="font-size: 2rem;"></i>
              <p class="mt-2">{{ $t('common.noResults') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SubnetForm
      :show="showEditForm"
      :subnet="subnet"
      @close="showEditForm = false"
      @saved="loadSubnet"
    />

    <IPForm
      :show="showIPForm"
      :ip="selectedIP"
      :subnet-id="subnet?.id"
      @close="showIPForm = false"
      @saved="loadIPs"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../services/api';
import SubnetForm from '../components/SubnetForm.vue';
import IPForm from '../components/IPForm.vue';

export default {
  name: 'SubnetDetail',
  components: {
    SubnetForm,
    IPForm,
  },
  setup() {
    const route = useRoute();
    const subnet = ref(null);
    const stats = ref({
      total_ips: 0,
      connected: 0,
      disconnected: 0,
      unknown: 0,
      health_percentage: 0,
    });
    const ips = ref([]);
    const loading = ref(true);
    const showEditForm = ref(false);
    const showIPForm = ref(false);
    const selectedIP = ref(null);
    const searchQuery = ref('');
    const scanning = ref(false);
    let autoScanInterval = null;

    const filteredIPs = computed(() => {
      if (!searchQuery.value) return ips.value;
      const query = searchQuery.value.toLowerCase();
      return ips.value.filter(
        (ip) =>
          ip.ip_address.includes(query) ||
          (ip.hostname && ip.hostname.toLowerCase().includes(query)) ||
          (ip.domain && ip.domain.toLowerCase().includes(query)) ||
          (ip.full_domain && ip.full_domain.toLowerCase().includes(query))
      );
    });

    async function loadSubnet() {
      try {
        loading.value = true;
        const subnetId = route.params.id;
        
        if (!subnetId) {
          console.error('No subnet ID in route params');
          subnet.value = null;
          return;
        }
        
        console.log('Loading subnet with ID:', subnetId);
        
        // Load subnet details
        const subnetResponse = await api.get(`/subnets/${subnetId}`);
        
        if (!subnetResponse.data) {
          console.error('Subnet response is empty');
          subnet.value = null;
          return;
        }
        
        subnet.value = subnetResponse.data;
        console.log('Subnet loaded:', subnet.value);
        
        // Load statistics
        try {
          const statsResponse = await api.get(`/subnets/${subnetId}/statistics`);
          if (statsResponse.data && statsResponse.data.statistics) {
            stats.value = statsResponse.data.statistics;
          }
        } catch (statsError) {
          console.warn('Failed to load statistics:', statsError);
          // Statistics are optional, continue without them
        }
      } catch (error) {
        console.error('Failed to load subnet:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          subnetId: route.params.id
        });
        
        if (error.response?.status === 404) {
          subnet.value = null;
        } else {
          // For other errors, still try to show something
          subnet.value = null;
        }
      } finally {
        loading.value = false;
      }
    }

    async function loadIPs() {
      try {
        const response = await api.get(`/subnets/${route.params.id}/ips`);
        ips.value = response.data;
      } catch (error) {
        console.error('Failed to load IPs:', error);
      }
    }

    async function scanSubnet() {
      scanning.value = true;
      try {
        await api.post(`/subnets/${route.params.id}/scan`);
        // Reload after a delay to see results
        setTimeout(() => {
          loadSubnet();
          loadIPs();
          scanning.value = false;
        }, 2000);
      } catch (error) {
        console.error('Failed to scan subnet:', error);
        alert(error.response?.data?.error || 'Failed to scan subnet');
        scanning.value = false;
      }
    }

    function editIP(ip) {
      selectedIP.value = ip;
      showIPForm.value = true;
    }

    function getHealthColor(percentage) {
      if (percentage >= 80) return 'text-success';
      if (percentage >= 60) return 'text-info';
      if (percentage >= 40) return 'text-warning';
      return 'text-danger';
    }

    function getRowClass(status) {
      if (status === 'connected') return 'table-row-connected';
      if (status === 'disconnected') return 'table-row-disconnected';
      return '';
    }

    function getStatusIcon(status) {
      if (status === 'connected') return 'bi bi-check-circle-fill';
      if (status === 'disconnected') return 'bi bi-x-circle-fill';
      return 'bi bi-question-circle-fill';
    }

    // Auto-scan functionality (frontend refresh only - actual scanning is done by backend scheduler)
    function startAutoScan() {
      // Auto-refresh data every 10 seconds to show updates from backend scheduler
      autoScanInterval = setInterval(() => {
        if (!scanning.value) {
          loadSubnet();
          loadIPs();
        }
      }, 10000); // Refresh every 10 seconds
    }

    function stopAutoScan() {
      if (autoScanInterval) {
        clearInterval(autoScanInterval);
        autoScanInterval = null;
      }
    }

    onMounted(() => {
      console.log('SubnetDetail mounted, route params:', route.params);
      loadSubnet().then(() => {
        loadIPs();
        startAutoScan();
      });
    });
    
    // Watch for route changes
    watch(() => route.params.id, (newId, oldId) => {
      if (newId && newId !== oldId) {
        console.log('Route ID changed from', oldId, 'to', newId);
        loadSubnet().then(() => {
          loadIPs();
        });
      }
    });

    onUnmounted(() => {
      stopAutoScan();
    });

    return {
      subnet,
      stats,
      ips,
      loading,
      showEditForm,
      showIPForm,
      selectedIP,
      searchQuery,
      filteredIPs,
      scanning,
      loadSubnet,
      loadIPs,
      scanSubnet,
      editIP,
      getHealthColor,
      getRowClass,
      getStatusIcon,
    };
  },
};
</script>

<style scoped>
.subnet-detail-page {
  padding: 0;
}

.subnet-info-card,
.ip-list-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 1.25rem 1.5rem;
}

.info-item {
  padding: 0.75rem 0;
}

.info-label {
  display: block;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 500;
}

.subnet-code {
  background: var(--bg-secondary);
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--primary);
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-box {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--primary);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.table-header {
  background: var(--bg-secondary);
  position: sticky;
  top: 0;
  z-index: 10;
}

.table-header th {
  background: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
  border-bottom: 2px solid var(--border-color);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  padding: 1rem 0.75rem;
}

.table tbody tr {
  border-bottom: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.table tbody tr:hover {
  background: var(--bg-secondary);
  transform: scale(1.01);
}

.table-row-connected {
  background: rgba(63, 185, 80, 0.1) !important;
}

.table-row-disconnected {
  background: rgba(248, 81, 73, 0.1) !important;
}

.ip-address-code {
  background: var(--bg-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  color: var(--primary);
  font-weight: 600;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

[data-theme='dark'] .table-header th {
  background: var(--bg-secondary) !important;
  color: var(--text-primary) !important;
}

[data-theme='dark'] .table tbody tr:hover {
  background: rgba(255, 38, 103, 0.1) !important;
}
</style>
