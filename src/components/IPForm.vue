<template>
  <div class="modal fade" :class="{ show: show, 'd-block': show }" tabindex="-1" v-if="show">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ $t('ips.edit') }}</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">{{ $t('ips.ipAddress') }}</label>
                <input type="text" class="form-control" :value="ip?.ip_address" disabled />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">{{ $t('ips.status') }} *</label>
                <select class="form-select" v-model="formData.status" required>
                  <option value="connected">{{ $t('ips.connected') }}</option>
                  <option value="disconnected">{{ $t('ips.disconnected') }}</option>
                  <option value="unknown">{{ $t('ips.unknown') }}</option>
                </select>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">{{ $t('ips.hostname') }}</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="formData.hostname"
                  :placeholder="$t('ips.hostname')"
                />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">{{ $t('ips.domain') }}</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="formData.domain"
                  :placeholder="$t('ips.domain')"
                />
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">{{ $t('ips.subdomain') }}</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="formData.subdomain"
                  :placeholder="$t('ips.subdomain')"
                />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">{{ $t('ips.fullDomain') }}</label>
                <input
                  type="text"
                  class="form-control"
                  :value="fullDomain"
                  disabled
                  :placeholder="$t('ips.fullDomain')"
                />
                <small class="form-text text-muted">Auto-generated from subdomain + domain</small>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">{{ $t('ips.macAddress') }}</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="formData.mac_address"
                  :placeholder="$t('ips.macAddress')"
                />
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label">{{ $t('ips.notes') }}</label>
              <textarea
                class="form-control"
                v-model="formData.notes"
                rows="3"
                :placeholder="$t('ips.notes')"
              ></textarea>
            </div>
            <div class="mb-3">
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary me-2"
                @click="resolveDNS('forward')"
                :disabled="!formData.domain"
              >
                {{ $t('ips.forwardDNS') }}
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                @click="resolveDNS('reverse')"
                :disabled="!ip?.ip_address"
              >
                {{ $t('ips.reverseDNS') }}
              </button>
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
            {{ $t('ips.update') }}
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
  name: 'IPForm',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    ip: {
      type: Object,
      default: null,
    },
    subnetId: {
      type: Number,
      default: null,
    },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const loading = ref(false);
    const error = ref(null);

    const formData = ref({
      status: 'unknown',
      hostname: '',
      domain: '',
      subdomain: '',
      mac_address: '',
      notes: '',
    });

    const fullDomain = computed(() => {
      if (formData.value.subdomain && formData.value.domain) {
        return `${formData.value.subdomain}.${formData.value.domain}`;
      } else if (formData.value.domain) {
        return formData.value.domain;
      }
      return '';
    });

    watch(
      () => props.ip,
      (newIP) => {
        if (newIP) {
          formData.value = {
            status: newIP.status || 'unknown',
            hostname: newIP.hostname || '',
            domain: newIP.domain || '',
            subdomain: newIP.subdomain || '',
            mac_address: newIP.mac_address || '',
            notes: newIP.notes || '',
          };
        } else {
          formData.value = {
            status: 'unknown',
            hostname: '',
            domain: '',
            subdomain: '',
            mac_address: '',
            notes: '',
          };
        }
        error.value = null;
      },
      { immediate: true }
    );

    async function handleSubmit() {
      if (!props.ip) return;

      error.value = null;
      loading.value = true;

      const updateData = {
        ...formData.value,
        full_domain: fullDomain.value,
      };

      try {
        await api.put(`/ips/${props.ip.id}`, updateData);
        emit('saved');
        emit('close');
      } catch (err) {
        error.value = err.response?.data?.error || err.message || 'An error occurred';
      } finally {
        loading.value = false;
      }
    }

    async function resolveDNS(type) {
      if (!props.ip) return;

      try {
        const target = type === 'forward' ? formData.value.domain : props.ip.ip_address;
        const response = await api.post(`/ips/${props.ip.id}/resolve`, { type, target });

        if (type === 'forward') {
          // Forward DNS result is an IP address
          alert(`Resolved to: ${response.data.result}`);
        } else {
          // Reverse DNS result is a hostname
          formData.value.hostname = response.data.result;
        }
      } catch (err) {
        alert(err.response?.data?.error || 'DNS resolution failed');
      }
    }

    return {
      formData,
      fullDomain,
      loading,
      error,
      handleSubmit,
      resolveDNS,
    };
  },
};
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>

