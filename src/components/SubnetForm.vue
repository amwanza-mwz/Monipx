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
            <div class="mb-3">
              <label class="form-label">{{ $t('subnets.scanInterval') }}</label>
              <input
                type="number"
                class="form-control"
                v-model.number="formData.scan_interval"
                min="60"
                :placeholder="$t('subnets.scanInterval')"
              />
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
      scan_interval: 300,
      monitoring_enabled: true,
    });

    // Only watch show - reset form when modal opens
    let lastShowState = false;
    watch(
      () => props.show,
      (isShowing) => {
        // Only act when modal transitions from closed to open
        if (isShowing && !lastShowState) {
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
            formData.value.scan_interval = newSubnet.scan_interval || 300;
            formData.value.monitoring_enabled = newSubnet.monitoring_enabled !== undefined ? Boolean(newSubnet.monitoring_enabled) : true;
            tagsInput.value = tagsArray.join(', ');
          } else {
            // Add mode - reset to empty
            formData.value.name = '';
            formData.value.subnet = '';
            formData.value.description = '';
            formData.value.tags = [];
            formData.value.scan_interval = 300;
            formData.value.monitoring_enabled = true;
            tagsInput.value = '';
          }
          error.value = null;
        }
        lastShowState = isShowing;
      }
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

