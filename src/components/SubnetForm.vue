<template>
  <div class="modal fade" :class="{ show: show, 'd-block': show }" tabindex="-1" v-if="show">
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
  <div class="modal-backdrop fade show" v-if="show"></div>
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

    watch(
      () => props.subnet,
      (newSubnet) => {
        if (newSubnet) {
          formData.value = {
            name: newSubnet.name || '',
            subnet: newSubnet.subnet || '',
            description: newSubnet.description || '',
            tags: newSubnet.tags ? (typeof newSubnet.tags === 'string' ? JSON.parse(newSubnet.tags) : newSubnet.tags) : [],
            scan_interval: newSubnet.scan_interval || 300,
            monitoring_enabled: newSubnet.monitoring_enabled !== undefined ? newSubnet.monitoring_enabled : true,
          };
          tagsInput.value = formData.value.tags.join(', ');
        } else {
          formData.value = {
            name: '',
            subnet: '',
            description: '',
            tags: [],
            scan_interval: 300,
            monitoring_enabled: true,
          };
          tagsInput.value = '';
        }
        error.value = null;
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
  background-color: rgba(0, 0, 0, 0.5);
}
</style>

