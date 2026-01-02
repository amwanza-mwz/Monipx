<template>
  <div class="monitor-detail-page" :class="{ 'fullscreen': isFullscreen }">
    <div class="detail-container">
      <!-- Modern Header -->
      <div class="detail-header">
        <div class="header-left">
          <button class="btn-back" @click="$router.push('/monitoring')">
            <i class="bi bi-arrow-left"></i>
          </button>
          <div class="monitor-info">
            <div class="monitor-title">
              <span :class="`status-dot status-${statusClass}`"></span>
              <h1>{{ monitor?.name || 'Loading...' }}</h1>
            </div>
            <div class="monitor-meta">
              <span class="badge badge-type">
                <i :class="`bi ${getTypeIcon(monitor?.type)}`"></i>
                {{ monitor?.type?.toUpperCase() }}
              </span>
              <span v-if="monitor?.group_name" class="badge badge-group">
                <i class="bi bi-folder"></i>
                {{ monitor.group_name }}
              </span>
              <span class="target-url">
                <i class="bi bi-link-45deg"></i>
                {{ monitor?.target }}
              </span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-icon" @click="toggleFullscreen" :title="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'">
            <i :class="isFullscreen ? 'bi bi-fullscreen-exit' : 'bi bi-arrows-fullscreen'"></i>
          </button>
          <button class="btn-check" @click="checkNow" :disabled="checking">
            <i class="bi bi-arrow-clockwise" :class="{ 'spin': checking }"></i>
            {{ checking ? 'Checking...' : 'Check Now' }}
          </button>
          <button class="btn-edit" @click="showEditMonitor = true">
            <i class="bi bi-pencil"></i>
            Edit
          </button>
        </div>
      </div>

      <!-- Modern Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" :class="`bg-${statusColor}`">
            <i :class="`bi ${statusIcon}`"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Status</div>
            <div class="stat-value" :class="`text-${statusColor}`">
              {{ monitor?.status?.toUpperCase() || 'UNKNOWN' }}
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-success">
            <i class="bi bi-graph-up-arrow"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Uptime</div>
            <div class="stat-value">{{ uptimePercentage }}%</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-info">
            <i class="bi bi-speedometer2"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Response Time</div>
            <div class="stat-value">{{ responseTime }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon bg-warning">
            <i class="bi bi-clock-history"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">Last Check</div>
            <div class="stat-value small">{{ lastCheckTime }}</div>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div v-if="monitor?.description" class="description-card">
        <i class="bi bi-info-circle"></i>
        <span>{{ monitor.description }}</span>
      </div>

      <!-- Modern Chart Card -->
      <div class="chart-card">
        <div class="chart-header">
          <div class="chart-title">
            <i class="bi bi-activity"></i>
            <h3>Response Time</h3>
          </div>
          <div class="time-range-selector">
            <button
              v-for="range in timeRanges"
              :key="range.value"
              :class="{ active: timeRange === range.value }"
              @click="timeRange = range.value"
            >
              {{ range.label }}
            </button>
          </div>
        </div>

        <!-- Speed Legend -->
        <div class="speed-legend" v-if="history.length > 0 && monitor?.status === 'up'">
          <div class="legend-item">
            <span class="legend-color" style="background: rgb(34, 197, 94);"></span>
            <span class="legend-label">Excellent (&lt;100ms)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background: rgb(74, 222, 128);"></span>
            <span class="legend-label">Good (100-300ms)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background: rgb(132, 204, 22);"></span>
            <span class="legend-label">Fair (300-500ms)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background: rgb(234, 179, 8);"></span>
            <span class="legend-label">Slow (500ms-1s)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background: rgb(249, 115, 22);"></span>
            <span class="legend-label">Very Slow (&gt;1s)</span>
          </div>
        </div>

        <div class="chart-body">
          <div v-if="loadingHistory" class="chart-loading">
            <div class="spinner"></div>
            <p>Loading chart data...</p>
          </div>
          <Line v-else-if="history.length > 0" :data="chartData" :options="chartOptions" />
          <div v-else class="chart-empty">
            <i class="bi bi-graph-up"></i>
            <p>No data available yet</p>
            <small>Check the monitor to start collecting data</small>
          </div>
        </div>
      </div>

      <!-- Uptime History -->
      <div class="uptime-card" v-if="actualUptimeHistory.length > 0">
        <div class="uptime-header">
          <div class="uptime-title">
            <i class="bi bi-calendar3"></i>
            <h3>Uptime History</h3>
            <span class="uptime-subtitle">{{ actualUptimeHistory.length }} days of monitoring</span>
          </div>
        </div>
        <div class="uptime-timeline">
          <div
            v-for="(day, index) in actualUptimeHistory"
            :key="index"
            :class="`uptime-day ${day.status}`"
            :title="`${day.date}: ${day.uptime}% uptime`"
          ></div>
        </div>
        <div class="uptime-legend">
          <span class="legend-item">
            <span class="legend-dot up"></span>
            Operational (≥95%)
          </span>
          <span class="legend-item">
            <span class="legend-dot degraded"></span>
            Degraded (90-95%)
          </span>
          <span class="legend-item">
            <span class="legend-dot down"></span>
            Down (<90%)
          </span>
        </div>
      </div>

      <!-- Recent Checks Table -->
      <div class="checks-card">
        <div class="checks-header">
          <div class="checks-title">
            <i class="bi bi-clock-history"></i>
            <h3>Recent Checks</h3>
          </div>
        </div>
        <div class="checks-body">
          <div v-if="loadingHistory" class="checks-loading">
            <div class="spinner"></div>
            <p>Loading history...</p>
          </div>
          <div v-else-if="history.length === 0" class="checks-empty">
            <i class="bi bi-inbox"></i>
            <p>No check history yet</p>
          </div>
          <div v-else class="checks-table">
            <div class="check-row check-header-row">
              <div class="check-status">Status</div>
              <div class="check-response">Response</div>
              <div class="check-code">Code</div>
              <div class="check-message">Message</div>
              <div class="check-time">Time</div>
            </div>
            <div
              v-for="check in history.slice(0, 20)"
              :key="check.id"
              class="check-row"
            >
              <div class="check-status">
                <span :class="`status-badge status-${check.status}`">
                  <i :class="`bi ${check.status === 'up' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`"></i>
                  {{ check.status.toUpperCase() }}
                </span>
              </div>
              <div class="check-response">
                {{ formatResponseTime(check.response_time) }}
              </div>
              <div class="check-code">
                <span v-if="check.status_code" class="code-badge">{{ check.status_code }}</span>
                <span v-else class="text-muted">-</span>
              </div>
              <div class="check-message">
                <span v-if="check.error_message" class="error-text">{{ check.error_message }}</span>
                <span v-else class="success-text">OK</span>
              </div>
              <div class="check-time">
                {{ formatDateTime(check.checked_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Monitor Modal -->
    <MonitorForm
      v-if="showEditMonitor"
      :monitor="monitor"
      @close="showEditMonitor = false"
      @saved="handleMonitorSaved"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import api from '../services/api';
import socket from '../services/socket';
import MonitorForm from '../components/MonitorForm.vue';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default {
  name: 'MonitorDetail',
  components: {
    Line,
    MonitorForm,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const monitor = ref(null);
    const history = ref([]);
    const loadingHistory = ref(false);
    const checking = ref(false);
    const showEditMonitor = ref(false);
    const timeRange = ref(24);
    const isFullscreen = ref(false);

    const timeRanges = [
      { label: '1H', value: 1 },
      { label: '6H', value: 6 },
      { label: '24H', value: 24 },
      { label: '7D', value: 168 },
      { label: '30D', value: 720 },
    ];

    const statusClass = computed(() => {
      if (!monitor.value) return 'unknown';
      return monitor.value.status || 'unknown';
    });

    const statusIcon = computed(() => {
      switch (statusClass.value) {
        case 'up':
          return 'bi-check-circle-fill';
        case 'down':
          return 'bi-x-circle-fill';
        default:
          return 'bi-question-circle-fill';
      }
    });

    const statusColor = computed(() => {
      switch (statusClass.value) {
        case 'up':
          return 'success';
        case 'down':
          return 'danger';
        default:
          return 'warning';
      }
    });

    const uptimePercentage = computed(() => {
      if (!monitor.value) return '0.00';
      return (monitor.value.uptime_percentage || 0).toFixed(2);
    });

    const responseTime = computed(() => {
      // Try response_time first, then last_response_time for compatibility
      const time = monitor.value?.response_time || monitor.value?.last_response_time;
      if (!time) return '-';
      return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
    });

    const lastCheckTime = computed(() => {
      if (!monitor.value?.last_check_at) return 'Never';
      return formatDateTime(monitor.value.last_check_at);
    });

    const getTypeIcon = (type) => {
      const icons = {
        http: 'bi-globe',
        https: 'bi-shield-lock',
        ping: 'bi-router',
        tcp: 'bi-hdd-network',
        docker: 'bi-box',
        database: 'bi-database',
      };
      return icons[type?.toLowerCase()] || 'bi-question-circle';
    };

    const chartData = computed(() => {
      if (!history.value.length) return { labels: [], datasets: [] };

      const labels = [];
      const data = [];
      const statusData = [];

      history.value.forEach((check) => {
        const date = new Date(check.checked_at);
        labels.push(date.toLocaleTimeString());
        data.push(check.response_time || 0);
        statusData.push(check.status);
      });

      const reversedData = data.reverse();
      const reversedStatus = statusData.reverse();

      // Function to get color based on response time (when UP)
      const getSpeedColor = (responseTime) => {
        if (responseTime < 100) {
          return 'rgb(34, 197, 94)'; // Bright green - Excellent (< 100ms)
        } else if (responseTime < 300) {
          return 'rgb(74, 222, 128)'; // Light green - Good (100-300ms)
        } else if (responseTime < 500) {
          return 'rgb(132, 204, 22)'; // Yellow-green - Fair (300-500ms)
        } else if (responseTime < 1000) {
          return 'rgb(234, 179, 8)'; // Yellow - Slow (500-1000ms)
        } else {
          return 'rgb(249, 115, 22)'; // Orange - Very slow (> 1000ms)
        }
      };

      return {
        labels: labels.reverse(),
        datasets: [
          {
            label: 'Response Time (ms)',
            data: reversedData,
            // Dynamic color: Brand color when DOWN, speed-based GREEN when UP
            segment: {
              borderColor: (ctx) => {
                const index = ctx.p0DataIndex;
                const status = reversedStatus[index];
                const responseTime = reversedData[index];

                // Brand color (pink/red) when down
                if (status === 'down') {
                  return 'rgb(255, 38, 103)';
                }

                // Speed-based color when up
                return getSpeedColor(responseTime);
              },
            },
            borderColor: 'rgb(40, 167, 69)', // Default green when up
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              // Check current status for gradient
              const currentStatus = monitor.value?.status;
              const currentResponseTime = monitor.value?.response_time || 0;

              if (currentStatus === 'down') {
                gradient.addColorStop(0, 'rgba(255, 38, 103, 0.3)'); // Brand color when down
                gradient.addColorStop(1, 'rgba(255, 38, 103, 0.0)');
              } else {
                // Speed-based gradient when up
                const color = getSpeedColor(currentResponseTime);
                const rgbMatch = color.match(/\d+/g);
                if (rgbMatch) {
                  gradient.addColorStop(0, `rgba(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}, 0.3)`);
                  gradient.addColorStop(1, `rgba(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}, 0.0)`);
                }
              }
              return gradient;
            },
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: (context) => {
              // Show larger dot when down
              const index = context.dataIndex;
              const status = reversedStatus[index];
              return status === 'down' ? 6 : 0;
            },
            pointBackgroundColor: (context) => {
              const index = context.dataIndex;
              const status = reversedStatus[index];
              const responseTime = reversedData[index];

              // Brand color when down, speed-based color when up
              if (status === 'down') {
                return 'rgb(255, 38, 103)';
              }
              return getSpeedColor(responseTime);
            },
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: (context) => {
              const index = context.dataIndex;
              const status = reversedStatus[index];
              const responseTime = reversedData[index];

              if (status === 'down') {
                return 'rgb(255, 38, 103)';
              }
              return getSpeedColor(responseTime);
            },
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3,
          },
        ],
      };
    });

    const chartOptions = computed(() => {
      // Calculate smart Y-axis range based on data
      const values = history.value.map(h => h.response_time || 0).filter(v => v > 0);
      const maxValue = values.length > 0 ? Math.max(...values) : 100;
      const minValue = values.length > 0 ? Math.min(...values) : 0;

      // Smart scaling based on response time range
      let suggestedMax;
      let suggestedMin;
      let beginAtZero = false;

      if (maxValue < 100) {
        // Ping monitor - DON'T start at zero, show the actual range
        beginAtZero = false;
        suggestedMin = Math.max(0, minValue - (maxValue - minValue) * 0.2); // Add 20% padding below
        suggestedMax = maxValue + (maxValue - minValue) * 0.3; // Add 30% padding above

        // Ensure minimum scale of at least 20ms for visibility
        if (suggestedMax - suggestedMin < 20) {
          const mid = (suggestedMax + suggestedMin) / 2;
          suggestedMin = Math.max(0, mid - 10);
          suggestedMax = mid + 10;
        }
      } else if (maxValue < 500) {
        // Fast HTTP - start at zero but with reasonable max
        beginAtZero = true;
        suggestedMin = 0;
        suggestedMax = maxValue * 1.3;
      } else {
        // Slow responses - auto scale from zero
        beginAtZero = true;
        suggestedMin = 0;
        suggestedMax = undefined; // Let Chart.js decide
      }

      return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750,
          easing: 'easeInOutQuart',
          onComplete: () => {
            // Animation complete
          },
        },
        transitions: {
          active: {
            animation: {
              duration: 400,
            },
          },
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#fff',
            displayColors: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return value < 1000 ? `${value}ms` : `${(value / 1000).toFixed(2)}s`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              maxTicksLimit: 8,
              color: 'var(--text-muted)',
            },
          },
          y: {
            beginAtZero: beginAtZero,
            min: suggestedMin,
            max: suggestedMax,
            grid: {
              color: 'var(--border-color)',
              drawBorder: false,
            },
            ticks: {
              color: 'var(--text-muted)',
              callback: (value) => {
                return value < 1000 ? `${value}ms` : `${(value / 1000).toFixed(1)}s`;
              },
            },
          },
        },
      };
    });


    // Calculate actual uptime history based on monitor creation date
    const actualUptimeHistory = computed(() => {
      if (!monitor.value?.created_at) return [];

      const createdDate = new Date(monitor.value.created_at);
      const today = new Date();
      const daysSinceCreation = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));

      if (daysSinceCreation < 0) return [];

      const days = [];
      const maxDays = Math.min(daysSinceCreation + 1, 90); // Show up to 90 days

      for (let i = maxDays - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Calculate uptime for this day based on actual history
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const dayChecks = history.value.filter(check => {
          const checkDate = new Date(check.checked_at);
          return checkDate >= dayStart && checkDate <= dayEnd;
        });

        let uptime = 100;
        let status = 'up';

        if (dayChecks.length > 0) {
          const successfulChecks = dayChecks.filter(c => c.status === 'up').length;
          uptime = (successfulChecks / dayChecks.length) * 100;

          if (uptime < 90) status = 'down';
          else if (uptime < 95) status = 'degraded';
          else status = 'up';
        } else if (date < today) {
          // No checks for this day - assume unknown/degraded
          uptime = 0;
          status = 'down';
        }

        days.push({
          date: date.toLocaleDateString(),
          uptime: uptime.toFixed(1),
          status,
        });
      }

      return days;
    });

    const loadMonitor = async () => {
      try {
        const response = await api.get(`/monitors/${route.params.id}`);
        monitor.value = response.data;
      } catch (error) {
        console.error('Error loading monitor:', error);
        alert('Failed to load monitor');
        router.push('/monitoring');
      }
    };

    const loadHistory = async () => {
      try {
        loadingHistory.value = true;
        const limit = timeRange.value * 60; // Approximate checks based on time range
        const response = await api.get(`/monitors/${route.params.id}/history?limit=${limit}`);
        history.value = response.data;
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        loadingHistory.value = false;
      }
    };

    const checkNow = async () => {
      try {
        checking.value = true;
        await api.post(`/monitors/${route.params.id}/check`);
        await loadMonitor();
        await loadHistory();
      } catch (error) {
        console.error('Error checking monitor:', error);
        alert('Failed to check monitor');
      } finally {
        checking.value = false;
      }
    };

    const handleMonitorSaved = () => {
      showEditMonitor.value = false;
      loadMonitor();
    };

    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value;
      if (isFullscreen.value) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    };

    const formatDateTime = (timestamp) => {
      if (!timestamp) return '-';
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;

      // Less than 1 minute
      if (diff < 60000) return 'Just now';
      // Less than 1 hour
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      // Less than 24 hours
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      // Less than 7 days
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

      return date.toLocaleString();
    };

    const formatResponseTime = (time) => {
      if (!time) return '-';
      return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
    };

    // Socket event handlers
    const handleMonitorChecked = (data) => {
      if (data.monitor_id === parseInt(route.params.id)) {
        loadMonitor();
        loadHistory();
      }
    };

    watch(timeRange, () => {
      loadHistory();
    });

    onMounted(() => {
      loadMonitor();
      loadHistory();

      socket.on('monitor:checked', handleMonitorChecked);

      // Listen for fullscreen changes
      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
          isFullscreen.value = false;
        }
      });
    });

    onUnmounted(() => {
      socket.off('monitor:checked', handleMonitorChecked);
    });

    return {
      monitor,
      history,
      loadingHistory,
      checking,
      showEditMonitor,
      timeRange,
      timeRanges,
      isFullscreen,
      statusClass,
      statusIcon,
      statusColor,
      uptimePercentage,
      responseTime,
      lastCheckTime,
      chartData,
      chartOptions,
      actualUptimeHistory,
      checkNow,
      handleMonitorSaved,
      toggleFullscreen,
      formatDateTime,
      formatResponseTime,
      getTypeIcon,
    };
  },
};
</script>


<style scoped>
/* CSS Variables for Dark Mode Support */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-card: #ffffff;
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --text-muted: #adb5bd;
  --border-color: #dee2e6;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.16);
}

[data-bs-theme="dark"] {
  --bg-primary: #1a1d23;
  --bg-secondary: #22262e;
  --bg-card: #2a2f3a;
  --text-primary: #e9ecef;
  --text-secondary: #adb5bd;
  --text-muted: #6c757d;
  --border-color: #3a3f4a;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.monitor-detail-page {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: 2rem;
  transition: all 0.3s ease;
}

.monitor-detail-page.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  padding: 1rem;
  overflow-y: auto;
}

.detail-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Modern Header */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;
  min-width: 0;
}

.btn-back {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-back:hover {
  background: var(--bg-secondary);
  transform: translateX(-4px);
}

.monitor-info {
  flex: 1;
  min-width: 0;
}

.monitor-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.monitor-title h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

.status-dot.status-up {
  background: #28a745;
  box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.2);
}

.status-dot.status-down {
  background: #dc3545;
  box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.2);
}

.status-dot.status-unknown {
  background: #ffc107;
  box-shadow: 0 0 0 4px rgba(255, 193, 7, 0.2);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.monitor-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.badge-type {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
}

.badge-group {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.target-url {
  color: var(--text-secondary);
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn-icon,
.btn-check,
.btn-edit {
  height: 48px;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1.25rem;
}

.btn-icon {
  width: 48px;
  padding: 0;
  justify-content: center;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.btn-icon:hover {
  background: var(--bg-card);
  transform: scale(1.05);
}

.btn-check {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
}

.btn-check:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(255, 38, 103, 0.3);
}

.btn-check:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-edit {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.btn-edit:hover {
  background: var(--bg-card);
  border-color: var(--primary);
  color: var(--primary);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Modern Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 1.25rem;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
}

.stat-icon.bg-success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.stat-icon.bg-danger {
  background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%);
}

.stat-icon.bg-warning {
  background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
}

.stat-icon.bg-info {
  background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.375rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-value.small {
  font-size: 1rem;
}

/* Description Card */
.description-card {
  background: linear-gradient(135deg, rgba(255, 38, 103, 0.1) 0%, rgba(224, 30, 87, 0.1) 100%);
  border: 1px solid rgba(255, 38, 103, 0.2);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-primary);
}

.description-card i {
  color: var(--primary);
  font-size: 1.25rem;
  flex-shrink: 0;
}

/* Modern Chart Card */
.chart-card {
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
  overflow: hidden;
}

.chart-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

/* Speed Legend */
.speed-legend {
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.legend-color {
  width: 20px;
  height: 12px;
  border-radius: 4px;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.legend-label {
  color: var(--text-secondary);
  font-weight: 500;
}

/* Make legend labels more visible in dark mode */
[data-theme='dark'] .legend-label,
[data-bs-theme='dark'] .legend-label {
  color: #ffffff !important;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.chart-title i {
  font-size: 1.5rem;
  color: var(--primary);
}

.chart-title h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.time-range-selector {
  display: flex;
  gap: 0.5rem;
  background: var(--bg-secondary);
  padding: 0.375rem;
  border-radius: 10px;
}

.time-range-selector button {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.time-range-selector button:hover {
  color: var(--text-primary);
}

.time-range-selector button.active {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
}

.chart-body {
  padding: 2rem;
  min-height: 350px;
  position: relative;
}

.chart-loading,
.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--text-secondary);
}

.chart-loading .spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.chart-empty i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.chart-empty p {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.chart-empty small {
  color: var(--text-muted);
}


/* Uptime History Card */
.uptime-card {
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
  padding: 1.5rem;
}

.uptime-header {
  margin-bottom: 1.5rem;
}

.uptime-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.uptime-title i {
  font-size: 1.5rem;
  color: var(--primary);
}

.uptime-title h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.uptime-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.uptime-timeline {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10px, 1fr));
  gap: 4px;
  margin-bottom: 1.5rem;
  max-width: 100%;
}

.uptime-day {
  aspect-ratio: 1;
  border-radius: 4px;
  background: var(--border-color);
  transition: all 0.2s;
  cursor: pointer;
  min-height: 12px;
}

.uptime-day.up {
  background: #28a745;
}

.uptime-day.degraded {
  background: #ffc107;
}

.uptime-day.down {
  background: #dc3545;
}

.uptime-day:hover {
  opacity: 0.8;
  transform: scale(1.2);
  z-index: 10;
}

.uptime-legend {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.legend-dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-dot.up {
  background: #28a745;
}

.legend-dot.degraded {
  background: #ffc107;
}

.legend-dot.down {
  background: #dc3545;
}

/* Checks Card */
.checks-card {
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.checks-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.checks-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.checks-title i {
  font-size: 1.5rem;
  color: var(--primary);
}

.checks-title h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.checks-body {
  min-height: 200px;
}

.checks-loading,
.checks-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.checks-loading .spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.checks-empty i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.checks-table {
  width: 100%;
}

.check-row {
  display: grid;
  grid-template-columns: 120px 100px 80px 1fr 150px;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
  transition: background 0.2s;
}

.check-row:hover:not(.check-header-row) {
  background: var(--bg-secondary);
}

.check-header-row {
  background: var(--bg-secondary);
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.check-status,
.check-response,
.check-code,
.check-message,
.check-time {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge.status-up {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.status-badge.status-down {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.code-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--bg-secondary);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  color: var(--text-primary);
}

.error-text {
  color: #dc3545;
  font-size: 0.875rem;
}

.success-text {
  color: #28a745;
  font-size: 0.875rem;
}

.text-muted {
  color: var(--text-muted);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .check-row {
    grid-template-columns: 100px 80px 60px 1fr 120px;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
  }
}

@media (max-width: 768px) {
  .monitor-detail-page {
    padding: 1rem;
  }

  .detail-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: stretch;
  }

  .header-actions button {
    flex: 1;
  }

  .monitor-title h1 {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .chart-body {
    padding: 1rem;
  }

  .uptime-timeline {
    grid-template-columns: repeat(auto-fill, minmax(8px, 1fr));
    gap: 3px;
  }

  .uptime-day {
    min-height: 10px;
  }

  .check-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .check-header-row {
    display: none;
  }

  .check-status::before,
  .check-response::before,
  .check-code::before,
  .check-message::before,
  .check-time::before {
    content: attr(data-label);
    font-weight: 700;
    color: var(--text-secondary);
    display: block;
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
  }
}
</style>


