<template>
  <div class="card mb-3 subnet-card-modern">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h5 class="card-title mb-1">{{ subnet.name }}</h5>
          <p class="card-text text-muted mb-1">
            <code class="subnet-code">{{ subnet.subnet }}</code>
          </p>
          <p class="card-text text-muted small mb-2" v-if="subnet.description">
            {{ subnet.description }}
          </p>
        </div>
        <div class="text-end">
          <span
            class="badge health-badge"
            :class="{
              'bg-success': stats.health_percentage >= 80,
              'bg-warning': stats.health_percentage >= 50 && stats.health_percentage < 80,
              'bg-danger': stats.health_percentage < 50,
            }"
          >
            {{ stats.health_percentage }}%
          </span>
        </div>
      </div>
      <div class="row mt-3 mb-3">
        <div class="col-md-3">
          <small class="text-muted d-block">{{ $t('subnets.totalIPs') }}</small>
          <div class="fw-bold">{{ stats.total_ips }}</div>
        </div>
        <div class="col-md-3">
          <small class="text-muted text-success d-block">{{ $t('subnets.connected') }}</small>
          <div class="fw-bold text-success">{{ stats.connected }}</div>
        </div>
        <div class="col-md-3">
          <small class="text-muted text-danger d-block">{{ $t('subnets.disconnected') }}</small>
          <div class="fw-bold text-danger">{{ stats.disconnected }}</div>
        </div>
        <div class="col-md-3">
          <small class="text-muted d-block">{{ $t('subnets.unknown') }}</small>
          <div class="fw-bold">{{ stats.unknown }}</div>
        </div>
      </div>
      <div class="subnet-actions">
        <button class="btn btn-sm btn-primary" @click="$emit('view', subnet.id)">
          <i class="bi bi-eye"></i> {{ $t('common.view') }}
        </button>
        <button class="btn btn-sm btn-outline-secondary" @click="$emit('edit', subnet)">
          <i class="bi bi-pencil"></i> {{ $t('common.edit') }}
        </button>
        <button 
          class="btn btn-sm btn-info scan-btn" 
          @click="$emit('scan', subnet.id)"
          :disabled="scanning"
        >
          <span v-if="scanning" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-arrow-repeat"></i>
          {{ scanning ? $t('subnets.scanning') : $t('subnets.scan') }}
        </button>
        <button class="btn btn-sm btn-outline-danger" @click="$emit('delete', subnet.id)">
          <i class="bi bi-trash"></i> {{ $t('common.delete') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SubnetCard',
  props: {
    subnet: {
      type: Object,
      required: true,
    },
    stats: {
      type: Object,
      default: () => ({
        total_ips: 0,
        connected: 0,
        disconnected: 0,
        unknown: 0,
        health_percentage: 0,
      }),
    },
    scanning: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['view', 'edit', 'scan', 'delete'],
};
</script>

<style scoped>
.subnet-card-modern {
  transition: all 0.3s ease;
  border-radius: 12px;
}

.subnet-card-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.subnet-code {
  background: var(--bg-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
}

.health-badge {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
}

.subnet-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.subnet-actions .btn {
  flex: 1;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.scan-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.subnet-actions .btn i {
  font-size: 0.875rem;
}
</style>

