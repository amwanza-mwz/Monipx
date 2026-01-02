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
                @input="analyzeSubnet"
                required
                placeholder="192.168.1.0/24"
                :disabled="isEdit"
              />
              <small class="form-text text-muted">{{ $t('subnets.subnet') }} (e.g., 192.168.1.0/24)</small>

              <!-- Smart Subnet Info -->
              <div v-if="subnetInfo.isValid" class="subnet-info-card mt-3">
                <div class="subnet-info-header">
                  <i class="bi bi-info-circle-fill me-2"></i>
                  <strong>Subnet Information</strong>
                </div>
                <div class="subnet-info-body">
                  <div class="info-row">
                    <span class="info-label">Network Address:</span>
                    <span class="info-value">{{ subnetInfo.networkAddress }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">First Usable IP:</span>
                    <span class="info-value">{{ subnetInfo.firstUsable }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Last Usable IP:</span>
                    <span class="info-value">{{ subnetInfo.lastUsable }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Broadcast:</span>
                    <span class="info-value">{{ subnetInfo.broadcast }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Total Hosts:</span>
                    <span class="info-value">{{ subnetInfo.totalHosts }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Usable Hosts:</span>
                    <span class="info-value">{{ subnetInfo.usableHosts }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Subnet Mask:</span>
                    <span class="info-value">{{ subnetInfo.subnetMask }}</span>
                  </div>
                </div>

                <!-- Auto-correct suggestion -->
                <div v-if="subnetInfo.needsCorrection" class="subnet-correction mt-2">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  <span>Did you mean <strong>{{ subnetInfo.correctedSubnet }}</strong>?</span>
                  <button type="button" class="btn btn-sm btn-primary ms-2" @click="applyCorrection">
                    Use This
                  </button>
                </div>
              </div>
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

    const subnetInfo = ref({
      isValid: false,
      networkAddress: '',
      firstUsable: '',
      lastUsable: '',
      broadcast: '',
      totalHosts: 0,
      usableHosts: 0,
      subnetMask: '',
      needsCorrection: false,
      correctedSubnet: '',
    });

    // Subnet calculation functions
    function ipToInt(ip) {
      const parts = ip.split('.').map(Number);
      return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
    }

    function intToIp(int) {
      return [
        (int >>> 24) & 0xFF,
        (int >>> 16) & 0xFF,
        (int >>> 8) & 0xFF,
        int & 0xFF
      ].join('.');
    }

    function cidrToMask(cidr) {
      const mask = ~((1 << (32 - cidr)) - 1);
      return intToIp(mask >>> 0);
    }

    function analyzeSubnet() {
      const subnetPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/;
      const match = formData.value.subnet.match(subnetPattern);

      if (!match) {
        subnetInfo.value.isValid = false;
        return;
      }

      const [, ip, cidrStr] = match;
      const cidr = parseInt(cidrStr);

      // Validate IP parts
      const ipParts = ip.split('.').map(Number);
      if (ipParts.some(part => part < 0 || part > 255)) {
        subnetInfo.value.isValid = false;
        return;
      }

      // Validate CIDR
      if (cidr < 0 || cidr > 32) {
        subnetInfo.value.isValid = false;
        return;
      }

      const ipInt = ipToInt(ip);
      const maskInt = ~((1 << (32 - cidr)) - 1) >>> 0;
      const networkInt = (ipInt & maskInt) >>> 0;
      const broadcastInt = (networkInt | ~maskInt) >>> 0;

      const totalHosts = Math.pow(2, 32 - cidr);
      const usableHosts = totalHosts > 2 ? totalHosts - 2 : totalHosts;

      const networkAddress = intToIp(networkInt);
      const firstUsable = cidr === 32 ? networkAddress : intToIp(networkInt + 1);
      const lastUsable = cidr === 32 ? networkAddress : intToIp(broadcastInt - 1);
      const broadcast = intToIp(broadcastInt);

      subnetInfo.value = {
        isValid: true,
        networkAddress,
        firstUsable,
        lastUsable,
        broadcast,
        totalHosts,
        usableHosts,
        subnetMask: cidrToMask(cidr),
        needsCorrection: ip !== networkAddress,
        correctedSubnet: `${networkAddress}/${cidr}`,
      };
    }

    function applyCorrection() {
      formData.value.subnet = subnetInfo.value.correctedSubnet;
      analyzeSubnet();
    }

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
      subnetInfo,
      handleSubmit,
      analyzeSubnet,
      applyCorrection,
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

/* Subnet Info Card */
.subnet-info-card {
  background: linear-gradient(135deg, rgba(13, 110, 253, 0.1) 0%, rgba(13, 110, 253, 0.05) 100%);
  border: 2px solid var(--info);
  border-radius: 12px;
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.subnet-info-header {
  background: var(--info);
  color: white;
  padding: 0.75rem 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.subnet-info-body {
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.subnet-correction {
  padding: 0.75rem 1rem;
  background: rgba(255, 193, 7, 0.1);
  border-top: 2px solid var(--warning);
  display: flex;
  align-items: center;
  color: var(--text-primary);
}

.subnet-correction i {
  color: var(--warning);
}

.subnet-correction strong {
  color: var(--primary);
  font-family: 'Courier New', monospace;
}
</style>

