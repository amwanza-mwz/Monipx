<template>
  <div class="activity-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <i class="bi bi-journal-text me-3"></i>
            Activity Logs
          </h1>
          <p class="page-subtitle">Monitor all user actions and system events</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline-light" @click="exportLogs">
            <i class="bi bi-download me-2"></i>
            Export
          </button>
        </div>
      </div>
    </div>

    <div class="page-content">
      <!-- Filters -->
      <div class="filters-card">
        <div class="filters-row">
          <div class="filter-group">
            <label>Category</label>
            <select class="form-select" v-model="filters.category" @change="loadLogs">
              <option value="">All Categories</option>
              <option value="auth">Authentication</option>
              <option value="user">User Management</option>
              <option value="team">Team</option>
              <option value="session">SSH Sessions</option>
              <option value="terminal">Terminal</option>
              <option value="key">SSH Keys</option>
              <option value="settings">Settings</option>
            </select>
          </div>
          <div class="filter-group">
            <label>User</label>
            <select class="form-select" v-model="filters.userId" @change="loadLogs">
              <option value="">All Users</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.username }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label>Date Range</label>
            <select class="form-select" v-model="dateRange" @change="applyDateRange">
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div class="filter-group search-group">
            <label>Search</label>
            <input
              type="text"
              class="form-control"
              v-model="filters.search"
              placeholder="Search logs..."
              @input="debounceSearch"
            />
          </div>
        </div>
      </div>

      <!-- Activity Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-activity"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ total }}</span>
            <span class="stat-label">Total Events</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon login">
            <i class="bi bi-box-arrow-in-right"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ loginCount }}</span>
            <span class="stat-label">Logins</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon terminal">
            <i class="bi bi-terminal"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ terminalCount }}</span>
            <span class="stat-label">Terminal Sessions</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon command">
            <i class="bi bi-code-slash"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ commandCount }}</span>
            <span class="stat-label">Commands Run</span>
          </div>
        </div>
      </div>

      <!-- Logs Table -->
      <div class="content-card">
        <div class="card-header">
          <h2 class="card-title">Recent Activity</h2>
          <div class="pagination-info">
            Showing {{ logs.length }} of {{ total }} events
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Category</th>
                <th>Resource</th>
                <th>IP Address</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" class="text-center py-4">
                  <div class="spinner-border text-primary"></div>
                </td>
              </tr>
              <tr v-else-if="logs.length === 0">
                <td colspan="7" class="text-center py-4 text-muted">
                  No activity logs found
                </td>
              </tr>
              <tr v-for="log in logs" :key="log.id">
                <td>
                  <div class="time-cell">
                    <span class="time">{{ formatTime(log.created_at) }}</span>
                    <span class="date-relative">{{ relativeTime(log.created_at) }}</span>
                  </div>
                </td>
                <td>
                  <div class="user-cell" v-if="log.username">
                    <div class="user-avatar-sm">
                      {{ log.username.charAt(0).toUpperCase() }}
                    </div>
                    <span>{{ log.username }}</span>
                  </div>
                  <span v-else class="text-muted">System</span>
                </td>
                <td>
                  <span :class="['action-badge', getActionClass(log.action)]">
                    <i :class="getActionIcon(log.action)" class="me-1"></i>
                    {{ formatAction(log.action) }}
                  </span>
                </td>
                <td>
                  <span :class="['category-badge', `category-${log.category}`]">
                    {{ formatCategory(log.category) }}
                  </span>
                </td>
                <td>
                  <div v-if="log.action === 'execute_command' && log.details?.command" class="command-preview" :title="log.details.command">
                    <i class="bi bi-chevron-right"></i>
                    <code>{{ truncate(log.details.command, 40) }}</code>
                  </div>
                  <span v-else-if="log.resource_name" class="resource-name">
                    {{ log.resource_name }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <code v-if="log.ip_address" class="ip-address">{{ log.ip_address }}</code>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <button
                    v-if="log.details"
                    class="btn-details"
                    @click="showDetails(log)"
                    title="View details"
                  >
                    <i class="bi bi-eye"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-footer" v-if="totalPages > 1">
          <button
            class="btn-page"
            :disabled="page === 1"
            @click="page--; loadLogs()"
          >
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="page-info">Page {{ page }} of {{ totalPages }}</span>
          <button
            class="btn-page"
            :disabled="page === totalPages"
            @click="page++; loadLogs()"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="selectedLog" class="modal-overlay" @click="selectedLog = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="bi bi-info-circle me-2"></i>
            Activity Details
          </h3>
          <button class="btn-close" @click="selectedLog = null">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-row">
            <span class="detail-label">Time</span>
            <span class="detail-value">{{ formatDateTime(selectedLog.created_at) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">User</span>
            <span class="detail-value">{{ selectedLog.username || 'System' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Action</span>
            <span class="detail-value">{{ formatAction(selectedLog.action) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Category</span>
            <span class="detail-value">{{ formatCategory(selectedLog.category) }}</span>
          </div>
          <div class="detail-row" v-if="selectedLog.resource_name">
            <span class="detail-label">Resource</span>
            <span class="detail-value">{{ selectedLog.resource_name }}</span>
          </div>
          <div class="detail-row" v-if="selectedLog.ip_address">
            <span class="detail-label">IP Address</span>
            <span class="detail-value">{{ selectedLog.ip_address }}</span>
          </div>
          <div class="detail-row" v-if="selectedLog.user_agent">
            <span class="detail-label">User Agent</span>
            <span class="detail-value small">{{ selectedLog.user_agent }}</span>
          </div>
          <div class="detail-row" v-if="selectedLog.action === 'execute_command' && selectedLog.details?.command">
            <span class="detail-label">Command</span>
            <code class="detail-command">{{ selectedLog.details.command }}</code>
          </div>
          <div class="detail-row" v-if="selectedLog.details?.host">
            <span class="detail-label">Host</span>
            <span class="detail-value">{{ selectedLog.details.host }}:{{ selectedLog.details.port || 22 }}</span>
          </div>
          <div class="detail-row" v-if="selectedLog.details?.sshUsername">
            <span class="detail-label">SSH User</span>
            <span class="detail-value">{{ selectedLog.details.sshUsername }}</span>
          </div>
          <div class="detail-row" v-if="selectedLog.details && !selectedLog.details.command">
            <span class="detail-label">Details</span>
            <pre class="detail-json">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

export default {
  name: 'ActivityLogs',
  setup() {
    const logs = ref([]);
    const users = ref([]);
    const loading = ref(true);
    const total = ref(0);
    const page = ref(1);
    const limit = 50;
    const selectedLog = ref(null);
    const dateRange = ref('week');

    const filters = ref({
      category: '',
      userId: '',
      search: '',
      startDate: '',
      endDate: '',
    });

    let searchTimeout = null;

    const totalPages = computed(() => Math.ceil(total.value / limit));
    const loginCount = computed(() =>
      logs.value.filter(l => l.action === 'login').length
    );
    const terminalCount = computed(() =>
      logs.value.filter(l => l.category === 'terminal' && l.action === 'connect').length
    );
    const commandCount = computed(() =>
      logs.value.filter(l => l.action === 'execute_command').length
    );

    async function loadLogs() {
      try {
        loading.value = true;
        const params = {
          page: page.value,
          limit,
          ...filters.value,
        };

        // Remove empty filters
        Object.keys(params).forEach(key => {
          if (!params[key]) delete params[key];
        });

        const response = await api.get('/activity-logs', { params });
        logs.value = response.data.logs;
        total.value = response.data.total;
      } catch (error) {
        console.error('Failed to load activity logs:', error);
      } finally {
        loading.value = false;
      }
    }

    async function loadUsers() {
      try {
        const response = await api.get('/team');
        users.value = response.data.members;
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    }

    function applyDateRange() {
      const now = new Date();
      switch (dateRange.value) {
        case 'today':
          filters.value.startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
          break;
        case 'week':
          filters.value.startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
          break;
        case 'month':
          filters.value.startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
          break;
        default:
          filters.value.startDate = '';
      }
      filters.value.endDate = '';
      loadLogs();
    }

    function debounceSearch() {
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => loadLogs(), 300);
    }

    function showDetails(log) {
      selectedLog.value = log;
    }

    function exportLogs() {
      const csv = [
        ['Time', 'User', 'Action', 'Category', 'Resource', 'IP Address'].join(','),
        ...logs.value.map(log => [
          log.created_at,
          log.username || 'System',
          log.action,
          log.category,
          log.resource_name || '',
          log.ip_address || '',
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }

    function formatTime(dateStr) {
      return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    function formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }

    function formatDateTime(dateStr) {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }

    function formatAction(action) {
      return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    function formatCategory(category) {
      return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    function getActionClass(action) {
      if (action.includes('login')) return 'action-auth';
      if (action.includes('create') || action.includes('invite')) return 'action-create';
      if (action.includes('delete') || action.includes('disable')) return 'action-delete';
      if (action.includes('update') || action.includes('change')) return 'action-update';
      if (action.includes('execute_command')) return 'action-command';
      if (action.includes('connect')) return 'action-connect';
      if (action.includes('disconnect')) return 'action-disconnect';
      return 'action-default';
    }

    function getActionIcon(action) {
      if (action === 'login') return 'bi bi-box-arrow-in-right';
      if (action === 'login_failed') return 'bi bi-x-circle';
      if (action === 'logout') return 'bi bi-box-arrow-right';
      if (action === 'connect') return 'bi bi-plug';
      if (action === 'disconnect') return 'bi bi-plug-fill';
      if (action === 'execute_command') return 'bi bi-terminal';
      if (action === 'create') return 'bi bi-plus-circle';
      if (action === 'update') return 'bi bi-pencil';
      if (action === 'delete') return 'bi bi-trash';
      if (action === 'invite') return 'bi bi-person-plus';
      if (action === 'change_role') return 'bi bi-shield';
      if (action === 'enable_2fa' || action === 'disable_2fa') return 'bi bi-shield-lock';
      return 'bi bi-circle';
    }

    function relativeTime(dateStr) {
      const now = new Date();
      const date = new Date(dateStr);
      const diff = Math.floor((now - date) / 1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
      return formatDate(dateStr);
    }

    function truncate(str, len) {
      if (!str) return '';
      return str.length > len ? str.substring(0, len) + '...' : str;
    }

    onMounted(() => {
      applyDateRange();
      loadUsers();
    });

    return {
      logs,
      users,
      loading,
      total,
      page,
      totalPages,
      filters,
      dateRange,
      selectedLog,
      loginCount,
      terminalCount,
      commandCount,
      loadLogs,
      applyDateRange,
      debounceSearch,
      showDetails,
      exportLogs,
      formatTime,
      formatDate,
      formatDateTime,
      formatAction,
      formatCategory,
      getActionClass,
      getActionIcon,
      relativeTime,
      truncate,
    };
  },
};
</script>

<style scoped>
.activity-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.page-header {
  background: linear-gradient(135deg, #FF2667 0%, #d91e63 100%);
  padding: 2.5rem 3rem;
  box-shadow: 0 4px 20px rgba(255, 38, 103, 0.3);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 3rem;
}

/* Filters */
.filters-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.filter-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.form-select,
.form-control {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 38, 103, 0.1);
  color: #FF2667;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-icon.login {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-icon.terminal {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
}

.stat-icon.command {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* Cards */
.content-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  background: var(--bg-secondary);
}

.data-table td {
  padding: 0.875rem 1.5rem;
  border-top: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.time-cell {
  display: flex;
  flex-direction: column;
}

.time-cell .time {
  font-weight: 500;
}

.time-cell .date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.time-cell .date-relative {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-style: italic;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar-sm {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF2667 0%, #d91e63 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.action-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.action-auth {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.action-create {
  background: rgba(255, 38, 103, 0.1);
  color: #FF2667;
}

.action-update {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.action-delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.action-connect {
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
}

.action-disconnect {
  background: rgba(156, 163, 175, 0.1);
  color: #9ca3af;
}

.action-command {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.action-default {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.category-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.category-auth { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.category-user { background: rgba(124, 58, 237, 0.1); color: #7c3aed; }
.category-team { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
.category-session { background: rgba(255, 38, 103, 0.1); color: #FF2667; }
.category-terminal { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
.category-key { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.category-settings { background: rgba(107, 114, 128, 0.1); color: #6b7280; }

.command-preview {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 250px;
}

.command-preview i {
  color: #3b82f6;
  font-size: 0.625rem;
  flex-shrink: 0;
}

.command-preview code {
  font-size: 0.75rem;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-name {
  font-size: 0.8125rem;
}

.ip-address {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: var(--bg-secondary);
  border-radius: 4px;
}

.btn-details {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
}

.btn-details:hover {
  color: #FF2667;
}

/* Pagination */
.pagination-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.btn-page {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
}

.modal-body {
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  width: 120px;
  font-weight: 500;
  color: var(--text-muted);
  flex-shrink: 0;
}

.detail-value {
  color: var(--text-primary);
  word-break: break-word;
}

.detail-value.small {
  font-size: 0.75rem;
}

.detail-command {
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  word-break: break-all;
}

.detail-json {
  background: var(--bg-secondary);
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  overflow-x: auto;
  margin: 0;
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .page-content {
    padding: 1rem;
  }

  .filters-row {
    grid-template-columns: 1fr;
  }
}
</style>
