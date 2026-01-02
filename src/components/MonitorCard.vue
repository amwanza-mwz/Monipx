<template>
  <div class="monitor-card" :class="statusClass">
    <div class="monitor-card-header">
      <div class="monitor-info">
        <div class="monitor-status-indicator" :class="statusClass">
          <i :class="statusIcon"></i>
        </div>
        <div>
          <h5 class="monitor-name" @click="$emit('view', monitor)">
            {{ monitor.name }}
          </h5>
          <div class="monitor-meta">
            <span class="badge bg-secondary me-2">{{ monitor.type.toUpperCase() }}</span>
            <span v-if="monitor.group_name" class="badge bg-info">{{ monitor.group_name }}</span>
          </div>
        </div>
      </div>
      <div class="monitor-actions">
        <button class="btn btn-sm btn-outline-primary" @click="$emit('check', monitor)" title="Check Now">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
        <div class="dropdown">
          <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><button class="dropdown-item" type="button" @click="$emit('view', monitor)"><i class="bi bi-eye me-2"></i>View Details</button></li>
            <li><button class="dropdown-item" type="button" @click="$emit('edit', monitor)"><i class="bi bi-pencil me-2"></i>Edit</button></li>
            <li><hr class="dropdown-divider"></li>
            <li><button class="dropdown-item text-danger" type="button" @click="$emit('delete', monitor)"><i class="bi bi-trash me-2"></i>Delete</button></li>
          </ul>
        </div>
      </div>
    </div>

    <div class="monitor-card-body">
      <div class="monitor-target">
        <i class="bi bi-link-45deg me-2"></i>
        <span>{{ monitor.target }}</span>
        <span v-if="monitor.port" class="text-muted">:{{ monitor.port }}</span>
      </div>

      <div v-if="monitor.description" class="monitor-description">
        {{ monitor.description }}
      </div>

      <div class="monitor-stats">
        <div class="stat-item">
          <span class="stat-label">Uptime</span>
          <span class="stat-value">{{ uptimePercentage }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Response</span>
          <span class="stat-value">{{ responseTime }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Interval</span>
          <span class="stat-value">{{ monitor.interval || 60 }}s</span>
        </div>
      </div>

      <div v-if="monitor.last_check_at" class="monitor-last-check">
        <i class="bi bi-clock me-2"></i>
        <span class="text-muted">Last checked: {{ formatTime(monitor.last_check_at) }}</span>
      </div>

      <!-- Uptime bar (last 24 hours) -->
      <div class="uptime-bar">
        <div class="uptime-bar-segments">
          <div
            v-for="(segment, index) in uptimeSegments"
            :key="index"
            class="uptime-segment"
            :class="segment.status"
            :title="`${segment.status}: ${segment.time}`"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'MonitorCard',
  props: {
    monitor: {
      type: Object,
      required: true,
    },
  },
  emits: ['view', 'edit', 'delete', 'check'],
  setup(props) {
    const statusClass = computed(() => {
      const status = props.monitor.status || 'unknown';
      return `status-${status}`;
    });

    const statusIcon = computed(() => {
      const status = props.monitor.status || 'unknown';
      switch (status) {
        case 'up':
          return 'bi bi-check-circle-fill';
        case 'down':
          return 'bi bi-x-circle-fill';
        default:
          return 'bi bi-question-circle-fill';
      }
    });

    const uptimePercentage = computed(() => {
      return (props.monitor.uptime_percentage || 0).toFixed(2);
    });

    const responseTime = computed(() => {
      const time = props.monitor.response_time;
      if (!time) return 'N/A';
      return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
    });

    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;

      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return date.toLocaleString();
    };

    // Generate uptime segments (simplified - will be enhanced with real data)
    const uptimeSegments = computed(() => {
      const segments = [];
      for (let i = 0; i < 48; i++) {
        segments.push({
          status: props.monitor.status || 'unknown',
          time: `${i * 30}m ago`,
        });
      }
      return segments;
    });

    return {
      statusClass,
      statusIcon,
      uptimePercentage,
      responseTime,
      formatTime,
      uptimeSegments,
    };
  },
};
</script>

<style scoped>
.monitor-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  border-left: 4px solid #6c757d;
  color: var(--text-primary);
}

.monitor-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.monitor-card.status-up {
  border-left-color: #28a745;
}

.monitor-card.status-down {
  border-left-color: #dc3545;
}

.monitor-card.status-unknown {
  border-left-color: #ffc107;
}

.monitor-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.monitor-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

.monitor-status-indicator {
  font-size: 1.5rem;
  margin-top: 0.25rem;
}

.monitor-status-indicator.status-up {
  color: #28a745;
}

.monitor-status-indicator.status-down {
  color: #dc3545;
}

.monitor-status-indicator.status-unknown {
  color: #ffc107;
}

.monitor-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  cursor: pointer;
  color: var(--text-primary);
  transition: color 0.2s;
}

.monitor-name:hover {
  color: var(--primary);
}

.monitor-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.monitor-actions {
  display: flex;
  gap: 0.5rem;
}

.monitor-card-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.monitor-target {
  display: flex;
  align-items: center;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--text-primary);
  background: var(--bg-secondary);
  padding: 0.5rem;
  border-radius: 6px;
}

.monitor-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.monitor-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: 500;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.monitor-last-check {
  font-size: 0.75rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
}

.uptime-bar {
  margin-top: 0.5rem;
}

.uptime-bar-segments {
  display: flex;
  gap: 2px;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
}

.uptime-segment {
  flex: 1;
  background: #e9ecef;
  transition: background-color 0.2s;
}

.uptime-segment.up {
  background: #28a745;
}

.uptime-segment.down {
  background: #dc3545;
}

.uptime-segment.unknown {
  background: #ffc107;
}

.uptime-segment:hover {
  opacity: 0.8;
}
</style>

