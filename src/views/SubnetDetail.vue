<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mt-4 mb-4">
      <div>
        <button class="btn btn-sm btn-secondary me-2" @click="$router.push('/subnets')">
          ← {{ $t('common.back') }}
        </button>
        <h1 class="d-inline">{{ subnet?.name || $t('subnets.subnetDetails') }}</h1>
      </div>
      <div>
        <button class="btn btn-primary me-2" @click="showEditForm = true">
          {{ $t('common.edit') }}
        </button>
        <button class="btn btn-info" @click="scanSubnet">
          {{ $t('subnets.scan') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">{{ $t('common.loading') }}</span>
      </div>
    </div>

    <div v-else-if="!subnet" class="alert alert-danger">
      {{ $t('errors.notFound') }}
    </div>

    <div v-else>
      <!-- Subnet Information -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0">{{ $t('subnets.subnetDetails') }}</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <p><strong>{{ $t('subnets.name') }}:</strong> {{ subnet.name }}</p>
              <p><strong>{{ $t('subnets.subnet') }}:</strong> <code>{{ subnet.subnet }}</code></p>
              <p v-if="subnet.description">
                <strong>{{ $t('subnets.description') }}:</strong> {{ subnet.description }}
              </p>
            </div>
            <div class="col-md-6">
              <p><strong>{{ $t('subnets.statistics') }}:</strong></p>
              <ul class="list-unstyled">
                <li>{{ $t('subnets.totalIPs') }}: {{ stats.total_ips }}</li>
                <li class="text-success">{{ $t('subnets.connected') }}: {{ stats.connected }}</li>
                <li class="text-danger">{{ $t('subnets.disconnected') }}: {{ stats.disconnected }}</li>
                <li class="text-muted">{{ $t('subnets.unknown') }}: {{ stats.unknown }}</li>
                <li>
                  <strong>{{ $t('subnets.healthPercentage') }}: {{ stats.health_percentage }}%</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- IP Address List -->
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
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
              <thead class="table-light sticky-top">
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
                <tr v-for="ip in filteredIPs" :key="ip.id" :class="{ 'table-success': ip.status === 'connected' }">
                  <td><code class="text-primary fw-bold">{{ ip.ip_address }}</code></td>
                  <td>
                    <span
                      class="badge"
                      :class="{
                        'bg-success': ip.status === 'connected',
                        'bg-danger': ip.status === 'disconnected',
                        'bg-secondary': ip.status === 'unknown',
                      }"
                    >
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
              {{ $t('common.noResults') }}
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
import { ref, computed, onMounted } from 'vue';
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
        const response = await api.get(`/subnets/${route.params.id}/statistics`);
        subnet.value = response.data;
        stats.value = response.data.statistics || stats.value;
      } catch (error) {
        console.error('Failed to load subnet:', error);
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

    onMounted(() => {
      loadSubnet();
      loadIPs();
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
    };
  },
};
</script>

