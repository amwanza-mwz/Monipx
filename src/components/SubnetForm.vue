<template>
  <div class="modal fade" :class="{ show: show, 'd-block': show }" tabindex="-1" v-show="show">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ isEdit ? $t('subnets.editSubnet') : $t('subnets.addSubnet') }}
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="mb-3">
              <label class="form-label">{{ $t('subnets.name') }} *</label>
              <input
                type="text"
                class="form-control"
                v-model="formData.name"
                required
                :placeholder="$t('subnets.name')"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">{{ $t('subnets.subnet') }} *</label>
              <input
                type="text"
                class="form-control"
                v-model="formData.subnet"
                required
                placeholder="192.168.1.0/24"
                :disabled="isEdit"
              />
              <small class="form-text text-muted">{{ $t('subnets.subnet') }} (e.g., 192.168.1.0/24)</small>
            </div>
            <div class="mb-3">
              <label class="form-label">{{ $t('subnets.description') }}</label>
              <textarea
                class="form-control"
                v-model="formData.description"
                rows="2"
                :placeholder="$t('subnets.description')"
              ></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label">{{ $t('subnets.tags') }}</label>
              <input
                type="text"
                class="form-control"
                v-model="tagsInput"
                placeholder="office, production"
              />
              <small class="form-text text-muted">Comma-separated tags</small>
            </div>
            <div class="mb-3 form-check">
              <input
                type="checkbox"
                class="form-check-input"
                v-model="formData.scan_enabled"
                id="scanEnabled"
              />
              <label class="form-check-label" for="scanEnabled">
                <strong>Enable Auto-Scan</strong>
              </label>
              <small class="form-text text-muted d-block">Automatically scan this subnet at regular intervals</small>
            </div>
            <div class="mb-3" v-if="formData.scan_enabled">
              <label class="form-label">Auto-Scan Interval (minutes) *</label>
              <select class="form-select" v-model.number="formData.scan_interval">
                <option :value="60">1 minute</option>
                <option :value="300">5 minutes</option>
                <option :value="600">10 minutes</option>
                <option :value="900">15 minutes</option>
                <option :value="1800">30 minutes</option>
                <option :value="3600">1 hour</option>
                <option :value="7200">2 hours</option>
                <option :value="14400">4 hours</option>
                <option :value="21600">6 hours</option>
                <option :value="43200">12 hours</option>
                <option :value="86400">24 hours</option>
              </select>
              <small class="form-text text-muted">How often to automatically scan this subnet</small>
            </div>
            <div class="mb-3 form-check">
              <input
                type="checkbox"
                class="form-check-input"
                v-model="formData.monitoring_enabled"
                id="monitoringEnabled"
              />
              <label class="form-check-label" for="monitoringEnabled">
                {{ $t('subnets.monitoringEnabled') }}
              </label>
            </div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            {{ $t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-primary" @click="handleSubmit" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ isEdit ? $t('subnets.update') : $t('subnets.create') }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <div class="modal-backdrop fade show" v-show="show"></div>
</template>

<script>
import { ref, computed, watch } from 'vue';
import api from '../services/api';

export default {
  name: 'SubnetForm',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    subnet: {
      type: Object,
      default: null,
    },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const loading = ref(false);
    const error = ref(null);
    const tagsInput = ref('');

    const isEdit = computed(() => !!props.subnet);

    const formData = ref({
      name: '',
      subnet: '',
      description: '',
      tags: [],
      scan_enabled: true,
      scan_interval: 1800,
      monitoring_enabled: true,
    });

    // Watch for when modal opens and populate form data
    watch(
      () => props.show,
      (isShowing) => {
        if (isShowing) {
          if (props.subnet) {
            // Edit mode - populate with subnet data
            const newSubnet = props.subnet;
            let tagsArray = [];
            if (newSubnet.tags) {
              if (typeof newSubnet.tags === 'string') {
                try {
                  tagsArray = JSON.parse(newSubnet.tags);
                } catch (e) {
                  tagsArray = newSubnet.tags.split(',').map(t => t.trim()).filter(t => t);
                }
              } else if (Array.isArray(newSubnet.tags)) {
                tagsArray = newSubnet.tags;
              }
            }
            formData.value.name = newSubnet.name || '';
            formData.value.subnet = newSubnet.subnet || '';
            formData.value.description = newSubnet.description || '';
            formData.value.tags = tagsArray;
            formData.value.scan_enabled = newSubnet.scan_enabled !== undefined ? Boolean(newSubnet.scan_enabled) : true;
            formData.value.scan_interval = newSubnet.scan_interval || 1800;
            formData.value.monitoring_enabled = newSubnet.monitoring_enabled !== undefined ? Boolean(newSubnet.monitoring_enabled) : true;
            tagsInput.value = tagsArray.join(', ');
          } else {
            // Add mode - reset to empty
            formData.value.name = '';
            formData.value.subnet = '';
            formData.value.description = '';
            formData.value.tags = [];
            formData.value.scan_enabled = true;
            formData.value.scan_interval = 1800;
            formData.value.monitoring_enabled = true;
            tagsInput.value = '';
          }
          error.value = null;
        }
      },
      { immediate: true }
    );

    async function handleSubmit() {
      error.value = null;
      loading.value = true;

      // Parse tags
      formData.value.tags = tagsInput.value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      try {
        if (isEdit.value) {
          await api.put(`/subnets/${props.subnet.id}`, formData.value);
        } else {
          await api.post('/subnets', formData.value);
        }
        emit('saved');
        emit('close');
      } catch (err) {
        error.value = err.response?.data?.error || err.message || 'An error occurred';
      } finally {
        loading.value = false;
      }
    }

    return {
      formData,
      tagsInput,
      isEdit,
      loading,
      error,
      handleSubmit,
    };
  },
};
</script>

<style scoped>
.modal {
  z-index: 1055;
  pointer-events: auto;
}

.modal-backdrop {
  z-index: 1050;
  pointer-events: none;
}

.modal-content {
  background-color: var(--card-bg) !important;
  border: 1px solid var(--card-border) !important;
  pointer-events: auto;
}

.modal-header {
  background-color: var(--bg-secondary) !important;
  border-bottom: 1px solid var(--border-color) !important;
}

.modal-body {
  background-color: var(--card-bg) !important;
}

.modal-footer {
  background-color: var(--card-bg) !important;
  border-top: 1px solid var(--border-color) !important;
}

[data-theme='dark'] .modal-backdrop {
  background-color: rgba(0, 0, 0, 0.75) !important;
}
</style>

