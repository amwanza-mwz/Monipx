<template>
  <div class="container-fluid monitoring-page">
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 class="mb-1">Network Monitoring</h2>
            <p class="text-muted mb-0">Monitor your services and infrastructure</p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary" @click="refreshMonitors">
              <i class="bi bi-arrow-clockwise me-2"></i>Refresh
            </button>
            <button class="btn btn-primary" @click="showAddMonitor = true">
              <i class="bi bi-plus-circle me-2"></i>Add Monitor
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="row g-3 mb-4">
          <div class="col-md-3">
            <div class="stat-card stat-card-success">
              <div class="stat-card-content">
                <div class="stat-card-icon">
                  <i class="bi bi-check-circle-fill"></i>
                </div>
                <div class="stat-card-info">
                  <h6 class="stat-card-label">Up</h6>
                  <h2 class="stat-card-value">{{ stats.up }}</h2>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card stat-card-danger">
              <div class="stat-card-content">
                <div class="stat-card-icon">
                  <i class="bi bi-x-circle-fill"></i>
                </div>
                <div class="stat-card-info">
                  <h6 class="stat-card-label">Down</h6>
                  <h2 class="stat-card-value">{{ stats.down }}</h2>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card stat-card-warning">
              <div class="stat-card-content">
                <div class="stat-card-icon">
                  <i class="bi bi-question-circle-fill"></i>
                </div>
                <div class="stat-card-info">
                  <h6 class="stat-card-label">Unknown</h6>
                  <h2 class="stat-card-value">{{ stats.unknown }}</h2>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="stat-card stat-card-info">
              <div class="stat-card-content">
                <div class="stat-card-icon">
                  <i class="bi bi-activity"></i>
                </div>
                <div class="stat-card-info">
                  <h6 class="stat-card-label">Avg Uptime</h6>
                  <h2 class="stat-card-value">{{ stats.avgUptime.toFixed(1) }}%</h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter and Group Tabs -->
        <div class="monitor-controls mb-4">
          <div class="btn-group" role="group">
            <button
              type="button"
              class="btn btn-outline-primary"
              :class="{ active: selectedGroup === 'all' }"
              @click="selectedGroup = 'all'"
            >
              All ({{ monitors.length }})
            </button>
            <button
              v-for="group in groups"
              :key="group"
              type="button"
              class="btn btn-outline-primary"
              :class="{ active: selectedGroup === group }"
              @click="selectedGroup = group"
            >
              {{ group }} ({{ getGroupCount(group) }})
            </button>
          </div>

          <div class="filter-controls">
            <select class="form-select" v-model="filterType">
              <option value="all">All Types</option>
              <option value="http">HTTP/HTTPS</option>
              <option value="https">HTTP/HTTPS</option>
              <option value="ping">Ping</option>
              <option value="tcp">TCP</option>
              <option value="docker">Docker</option>
              <option value="database">Database</option>
            </select>
            <select class="form-select" v-model="filterStatus">
              <option value="all">All Status</option>
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>

        <!-- Monitors List -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>

        <div v-else-if="filteredMonitors.length === 0" class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          No monitors found. Click "Add Monitor" to create your first monitor.
        </div>

        <div v-else class="monitors-grid">
          <MonitorCard
            v-for="monitor in filteredMonitors"
            :key="monitor.id"
            :monitor="monitor"
            @view="viewMonitor"
            @edit="editMonitor"
            @delete="deleteMonitor"
            @check="checkMonitor"
          />
        </div>
      </div>
    </div>

    <!-- Add/Edit Monitor Modal -->
    <MonitorForm
      v-if="showAddMonitor || showEditMonitor"
      :monitor="selectedMonitor"
      :show="showAddMonitor || showEditMonitor"
      @close="closeMonitorForm"
      @saved="handleMonitorSaved"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import socket from '../services/socket';
import MonitorCard from '../components/MonitorCard.vue';
import MonitorForm from '../components/MonitorForm.vue';

export default {
  name: 'Monitoring',
  components: {
    MonitorCard,
    MonitorForm,
  },
  setup() {
    const router = useRouter();
    const monitors = ref([]);
    const loading = ref(true);
    const showAddMonitor = ref(false);
    const showEditMonitor = ref(false);
    const selectedMonitor = ref(null);
    const selectedGroup = ref('all');
    const filterType = ref('all');
    const filterStatus = ref('all');

    const stats = computed(() => {
      const up = monitors.value.filter(m => m.status === 'up').length;
      const down = monitors.value.filter(m => m.status === 'down').length;
      const unknown = monitors.value.filter(m => m.status === 'unknown' || !m.status).length;
      const avgUptime = monitors.value.length > 0
        ? monitors.value.reduce((sum, m) => sum + (m.uptime_percentage || 0), 0) / monitors.value.length
        : 0;

      return { up, down, unknown, avgUptime };
    });

    const groups = computed(() => {
      const groupSet = new Set();
      monitors.value.forEach(m => {
        if (m.group_name) {
          groupSet.add(m.group_name);
        }
      });
      return Array.from(groupSet).sort();
    });

    const filteredMonitors = computed(() => {
      return monitors.value.filter(monitor => {
        // Group filter
        if (selectedGroup.value !== 'all' && monitor.group_name !== selectedGroup.value) {
          return false;
        }

        // Type filter
        if (filterType.value !== 'all' && monitor.type.toLowerCase() !== filterType.value.toLowerCase()) {
          return false;
        }

        // Status filter
        if (filterStatus.value !== 'all') {
          const status = monitor.status || 'unknown';
          if (status !== filterStatus.value) {
            return false;
          }
        }

        return true;
      });
    });

    const getGroupCount = (group) => {
      return monitors.value.filter(m => m.group_name === group).length;
    };

    const loadMonitors = async () => {
      try {
        loading.value = true;
        const response = await api.get('/monitors');
        monitors.value = response.data;
      } catch (error) {
        console.error('Error loading monitors:', error);
      } finally {
        loading.value = false;
      }
    };

    const refreshMonitors = () => {
      loadMonitors();
    };

    const viewMonitor = (monitor) => {
      router.push(`/monitoring/${monitor.id}`);
    };

    const editMonitor = (monitor) => {
      selectedMonitor.value = monitor;
      showEditMonitor.value = true;
    };

    const deleteMonitor = async (monitor) => {
      if (!confirm(`Are you sure you want to delete monitor "${monitor.name}"?`)) {
        return;
      }

      try {
        await api.delete(`/monitors/${monitor.id}`);
        await loadMonitors();
      } catch (error) {
        console.error('Error deleting monitor:', error);
        alert('Failed to delete monitor');
      }
    };

    const checkMonitor = async (monitor) => {
      try {
        await api.post(`/monitors/${monitor.id}/check`);
      } catch (error) {
        console.error('Error checking monitor:', error);
      }
    };

    const closeMonitorForm = () => {
      showAddMonitor.value = false;
      showEditMonitor.value = false;
      selectedMonitor.value = null;
    };

    const handleMonitorSaved = () => {
      closeMonitorForm();
      loadMonitors();
    };

    // Socket event handlers
    const handleMonitorChecked = (data) => {
      const monitor = monitors.value.find(m => m.id === data.monitor_id);
      if (monitor) {
        monitor.status = data.status;
        monitor.response_time = data.response_time;
        monitor.last_check_at = data.checked_at;
      }
    };

    const handleMonitorCreated = (monitor) => {
      monitors.value.push(monitor);
    };

    const handleMonitorDeleted = (data) => {
      monitors.value = monitors.value.filter(m => m.id !== data.id);
    };

    onMounted(() => {
      loadMonitors();

      // Subscribe to socket events
      socket.on('monitor:checked', handleMonitorChecked);
      socket.on('monitor:created', handleMonitorCreated);
      socket.on('monitor:deleted', handleMonitorDeleted);
    });

    onUnmounted(() => {
      // Unsubscribe from socket events
      socket.off('monitor:checked', handleMonitorChecked);
      socket.off('monitor:created', handleMonitorCreated);
      socket.off('monitor:deleted', handleMonitorDeleted);
    });

    return {
      monitors,
      loading,
      stats,
      groups,
      selectedGroup,
      filterType,
      filterStatus,
      filteredMonitors,
      showAddMonitor,
      showEditMonitor,
      selectedMonitor,
      getGroupCount,
      refreshMonitors,
      viewMonitor,
      editMonitor,
      deleteMonitor,
      checkMonitor,
      closeMonitorForm,
      handleMonitorSaved,
    };
  },
};
</script>

<style scoped>
.monitoring-page {
  padding: 2rem 0;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  transition: transform 0.2s, box-shadow 0.2s;
  color: var(--text-primary);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-card-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-card-icon {
  font-size: 2.5rem;
  opacity: 0.9;
}

.stat-card-success .stat-card-icon {
  color: var(--success);
}

.stat-card-danger .stat-card-icon {
  color: var(--danger);
}

.stat-card-warning .stat-card-icon {
  color: var(--warning);
}

.stat-card-info .stat-card-icon {
  color: var(--info);
}

.stat-card-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.stat-card-value {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
  color: var(--text-primary);
}

.monitor-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-controls {
  display: flex;
  gap: 0.5rem;
}

.filter-controls .form-select {
  width: auto;
  min-width: 150px;
}

.monitors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .monitors-grid {
    grid-template-columns: 1fr;
  }

  .monitor-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-group {
    flex-wrap: wrap;
  }
}
</style>

