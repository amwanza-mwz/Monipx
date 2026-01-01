<template>
  <div class="card mb-3">
    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <h5 class="card-title">{{ subnet.name }}</h5>
          <p class="card-text text-muted mb-1">
            <code>{{ subnet.subnet }}</code>
          </p>
          <p class="card-text text-muted small mb-2" v-if="subnet.description">
            {{ subnet.description }}
          </p>
        </div>
        <div class="text-end">
          <span
            class="badge"
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
      <div class="row mt-3">
        <div class="col-md-3">
          <small class="text-muted">{{ $t('subnets.totalIPs') }}</small>
          <div class="fw-bold">{{ stats.total_ips }}</div>
        </div>
        <div class="col-md-3">
          <small class="text-muted text-success">{{ $t('subnets.connected') }}</small>
          <div class="fw-bold text-success">{{ stats.connected }}</div>
        </div>
        <div class="col-md-3">
          <small class="text-muted text-danger">{{ $t('subnets.disconnected') }}</small>
          <div class="fw-bold text-danger">{{ stats.disconnected }}</div>
        </div>
        <div class="col-md-3">
          <small class="text-muted">{{ $t('subnets.unknown') }}</small>
          <div class="fw-bold">{{ stats.unknown }}</div>
        </div>
      </div>
      <div class="mt-3">
        <button class="btn btn-sm btn-primary me-2" @click="$emit('view', subnet.id)">
          {{ $t('common.view') }}
        </button>
        <button class="btn btn-sm btn-secondary me-2" @click="$emit('edit', subnet)">
          {{ $t('common.edit') }}
        </button>
        <button class="btn btn-sm btn-info me-2" @click="$emit('scan', subnet.id)">
          {{ $t('subnets.scan') }}
        </button>
        <button class="btn btn-sm btn-danger" @click="$emit('delete', subnet.id)">
          {{ $t('common.delete') }}
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
  },
  emits: ['view', 'edit', 'scan', 'delete'],
};
</script>

