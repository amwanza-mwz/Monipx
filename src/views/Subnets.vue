<template>
  <div class="container-fluid">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>{{ $t('subnets.title') }}</h2>
      <div>
        <button class="btn btn-outline-primary me-2" @click="scanAllSubnets" :disabled="scanningAll">
          <span v-if="scanningAll" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-arrow-repeat"></i>
          {{ scanningAll ? $t('subnets.scanning') : $t('subnets.scanAll') }}
        </button>
        <button class="btn btn-primary" @click="showAddForm = true">
          <i class="bi bi-plus-circle"></i> {{ $t('subnets.addSubnet') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">{{ $t('common.loading') }}</span>
      </div>
    </div>

    <div v-else-if="subnets.length === 0" class="alert alert-info">
      {{ $t('subnets.noSubnets') }}
    </div>

    <div v-else>
      <div class="row">
        <div class="col-md-6 mb-3" v-for="subnet in subnets" :key="subnet.id">
          <SubnetCard
            :subnet="subnet"
            :stats="getSubnetStats(subnet.id)"
            :scanning="scanningSubnets.has(subnet.id)"
            @view="viewSubnet"
            @edit="editSubnet"
            @scan="scanSubnet"
            @delete="deleteSubnet"
          />
        </div>
      </div>
    </div>

    <SubnetForm
      :show="showAddForm || showEditForm"
      :subnet="selectedSubnet"
      @close="closeForm"
      @saved="loadSubnets"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import SubnetCard from '../components/SubnetCard.vue';
import SubnetForm from '../components/SubnetForm.vue';

export default {
  name: 'Subnets',
  components: {
    SubnetCard,
    SubnetForm,
  },
  setup() {
    const router = useRouter();
    const subnets = ref([]);
    const loading = ref(true);
    const showAddForm = ref(false);
    const showEditForm = ref(false);
    const selectedSubnet = ref(null);
    const subnetStats = ref({});
    const scanningAll = ref(false);
    const scanningSubnets = ref(new Set());

    async function loadSubnets() {
      try {
        loading.value = true;
        const response = await api.get('/subnets');
        subnets.value = response.data;

        // Load statistics for each subnet
        for (const subnet of subnets.value) {
          try {
            const statsResponse = await api.get(`/subnets/${subnet.id}/statistics`);
            subnetStats.value[subnet.id] = statsResponse.data.statistics || {
              total_ips: 0,
              connected: 0,
              disconnected: 0,
              unknown: 0,
              health_percentage: 0,
            };
          } catch (err) {
            console.error(`Failed to load stats for subnet ${subnet.id}:`, err);
          }
        }
      } catch (error) {
        console.error('Failed to load subnets:', error);
      } finally {
        loading.value = false;
      }
    }

    function getSubnetStats(subnetId) {
      return (
        subnetStats.value[subnetId] || {
          total_ips: 0,
          connected: 0,
          disconnected: 0,
          unknown: 0,
          health_percentage: 0,
        }
      );
    }

    function viewSubnet(subnetId) {
      router.push(`/subnets/${subnetId}`);
    }

    function editSubnet(subnet) {
      selectedSubnet.value = subnet;
      showEditForm.value = true;
    }

    async function scanSubnet(subnetId) {
      scanningSubnets.value.add(subnetId);
      try {
        await api.post(`/subnets/${subnetId}/scan`);
        // Reload after scan
        setTimeout(() => {
          loadSubnets();
          scanningSubnets.value.delete(subnetId);
        }, 2000);
      } catch (error) {
        console.error('Failed to scan subnet:', error);
        alert(error.response?.data?.error || 'Failed to scan subnet');
        scanningSubnets.value.delete(subnetId);
      }
    }

    async function scanAllSubnets() {
      scanningAll.value = true;
      try {
        await api.post('/subnets/scan-all');
        setTimeout(() => {
          loadSubnets();
          scanningAll.value = false;
        }, 3000);
      } catch (error) {
        console.error('Failed to scan all subnets:', error);
        alert(error.response?.data?.error || 'Failed to scan all subnets');
        scanningAll.value = false;
      }
    }

    async function deleteSubnet(subnetId) {
      if (!confirm('Are you sure you want to delete this subnet?')) {
        return;
      }

      try {
        await api.delete(`/subnets/${subnetId}`);
        loadSubnets();
      } catch (error) {
        console.error('Failed to delete subnet:', error);
        alert(error.response?.data?.error || 'Failed to delete subnet');
      }
    }

    function closeForm() {
      showAddForm.value = false;
      showEditForm.value = false;
      selectedSubnet.value = null;
    }

    onMounted(() => {
      loadSubnets();
    });

    return {
      subnets,
      loading,
      showAddForm,
      showEditForm,
      selectedSubnet,
      loadSubnets,
      getSubnetStats,
      viewSubnet,
      editSubnet,
      scanSubnet,
      scanAllSubnets,
      scanningAll,
      scanningSubnets,
      deleteSubnet,
      closeForm,
    };
  },
};
</script>


