<template>
  <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-plus-circle me-2"></i>
            {{ monitor ? 'Edit Monitor' : 'Add Monitor' }}
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>

        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <!-- Basic Information -->
            <div class="section-title">Basic Information</div>

            <div class="row g-3 mb-3">
              <div class="col-md-8">
                <label class="form-label required">Monitor Name</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-control"
                  placeholder="e.g., Production API Server"
                  required
                />
              </div>

              <div class="col-md-4">
                <label class="form-label required">Monitor Type</label>
                <select v-model="form.type" class="form-select" required>
                  <option value="">Select Type</option>
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="ping">Ping (ICMP)</option>
                  <option value="tcp">TCP Port</option>
                  <option value="docker">Docker Container</option>
                  <option value="database">Database</option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Description</label>
              <textarea
                v-model="form.description"
                class="form-control"
                rows="2"
                placeholder="Optional description for this monitor"
              ></textarea>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label">Group (Optional)</label>
                <input
                  v-model="form.group_name"
                  type="text"
                  class="form-control"
                  placeholder="Type or select a group"
                  list="existing-groups-list"
                  autocomplete="off"
                />
                <datalist id="existing-groups-list">
                  <option v-for="group in existingGroups" :key="group" :value="group">{{ group }}</option>
                </datalist>
                <small class="form-text text-muted d-block">
                  <span v-if="existingGroups.length > 0">
                    Existing groups: {{ existingGroups.join(', ') }}
                  </span>
                  <span v-else>
                    Type a group name (e.g., Production, Development)
                  </span>
                </small>
              </div>

              <div class="col-md-6">
                <label class="form-label">
                  <input type="checkbox" v-model="form.enabled" class="form-check-input me-2" />
                  Enable Monitoring
                </label>
                <small class="form-text text-muted d-block">
                  Start monitoring this service immediately
                </small>
              </div>
            </div>

            <!-- Target Configuration -->
            <div class="section-title">Target Configuration</div>

            <div class="row g-3 mb-3">
              <div class="col-md-8">
                <label class="form-label required">{{ targetLabel }}</label>
                <input
                  v-model="form.target"
                  type="text"
                  class="form-control"
                  :placeholder="targetPlaceholder"
                  required
                />
              </div>

              <div class="col-md-4" v-if="showPort">
                <label class="form-label" :class="{ required: portRequired }">Port</label>
                <input
                  v-model.number="form.port"
                  type="number"
                  class="form-control"
                  placeholder="e.g., 80, 443, 3306"
                  :required="portRequired"
                />
              </div>
            </div>

            <!-- HTTP/HTTPS Specific -->
            <div v-if="form.type === 'http' || form.type === 'https'" class="mb-3">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Expected Status Code</label>
                  <input
                    v-model.number="form.expected_status_code"
                    type="number"
                    class="form-control"
                    placeholder="200"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Expected Keyword</label>
                  <input
                    v-model="form.expected_keyword"
                    type="text"
                    class="form-control"
                    placeholder="Text to find in response"
                  />
                </div>
              </div>
            </div>

            <!-- Docker Specific -->
            <div v-if="form.type === 'docker'" class="mb-3">
              <label class="form-label">Docker Host</label>
              <input
                v-model="form.docker_host"
                type="text"
                class="form-control"
                placeholder="unix:///var/run/docker.sock or tcp://host:2375"
              />
              <small class="form-text text-muted">
                Leave empty to use local Docker socket
              </small>
            </div>

            <!-- Database Specific -->
            <div v-if="form.type === 'database'">
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label required">Database Type</label>
                  <select v-model="form.database_type" class="form-select" required>
                    <option value="">Select Type</option>
                    <option value="mysql">MySQL/MariaDB</option>
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mongodb">MongoDB</option>
                    <option value="redis">Redis</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label required">Database Name</label>
                  <input
                    v-model="form.database_name"
                    type="text"
                    class="form-control"
                    placeholder="Database name"
                    required
                  />
                </div>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label">Username</label>
                  <input
                    v-model="form.database_username"
                    type="text"
                    class="form-control"
                    placeholder="Database username"
                  />
                </div>
                <div class="col-md-6">
                  <label class="form-label">Password</label>
                  <input
                    v-model="form.database_password"
                    type="password"
                    class="form-control"
                    placeholder="Database password"
                    autocomplete="new-password"
                  />
                </div>
              </div>
            </div>

            <!-- Monitoring Settings -->
            <div class="section-title">Monitoring Settings</div>

            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <label class="form-label">Check Interval (seconds)</label>
                <input
                  v-model.number="form.interval"
                  type="number"
                  class="form-control"
                  placeholder="60"
                  min="10"
                />
                <small class="form-text text-muted">
                  How often to check (minimum 10 seconds)
                </small>
              </div>

              <div class="col-md-6">
                <label class="form-label">Timeout (milliseconds)</label>
                <input
                  v-model.number="form.timeout"
                  type="number"
                  class="form-control"
                  placeholder="5000"
                  min="1000"
                />
                <small class="form-text text-muted">
                  Request timeout (minimum 1000ms)
                </small>
              </div>
            </div>

            <!-- Notifications -->
            <div class="section-title">
              <i class="bi bi-bell me-2"></i>
              Notifications
            </div>

            <div class="notification-toggle mb-3">
              <div class="form-check form-switch">
                <input
                  type="checkbox"
                  v-model="form.notification_enabled"
                  class="form-check-input"
                  id="notificationToggle"
                  role="switch"
                />
                <label class="form-check-label" for="notificationToggle">
                  <strong>Enable Notifications</strong>
                  <small class="d-block text-muted">Get notified when monitor status changes</small>
                </label>
              </div>
            </div>

            <div v-if="form.notification_enabled" class="notification-settings">
              <!-- Notification Type -->
              <div class="mb-3">
                <label class="form-label">
                  <i class="bi bi-envelope me-2"></i>
                  Notification Type
                </label>
                <select v-model="form.notification_type" class="form-select">
                  <option value="email">Email</option>
                  <option value="webhook" disabled>Webhook (Coming Soon)</option>
                  <option value="slack" disabled>Slack (Coming Soon)</option>
                  <option value="discord" disabled>Discord (Coming Soon)</option>
                </select>
              </div>

              <!-- Email Recipients -->
              <div v-if="form.notification_type === 'email'" class="mb-3">
                <label class="form-label required">
                  <i class="bi bi-people me-2"></i>
                  Email Recipients
                </label>
                <textarea
                  v-model="form.email_recipients"
                  class="form-control"
                  rows="2"
                  placeholder="admin@example.com, team@example.com"
                  required
                ></textarea>
                <small class="form-text text-muted">
                  <i class="bi bi-info-circle me-1"></i>
                  Enter one or more email addresses separated by commas
                </small>
              </div>

              <!-- Notification Triggers -->
              <div class="notification-triggers">
                <label class="form-label mb-2">
                  <i class="bi bi-lightning me-2"></i>
                  Notification Triggers
                </label>
                <div class="row g-3">
                  <div class="col-md-6">
                    <div class="trigger-card">
                      <div class="form-check">
                        <input
                          type="checkbox"
                          v-model="form.notify_on_down"
                          class="form-check-input"
                          id="notifyDown"
                        />
                        <label class="form-check-label" for="notifyDown">
                          <i class="bi bi-x-circle text-danger me-2"></i>
                          <strong>Service Down</strong>
                          <small class="d-block text-muted">Alert when monitor goes offline</small>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="trigger-card">
                      <div class="form-check">
                        <input
                          type="checkbox"
                          v-model="form.notify_on_recovery"
                          class="form-check-input"
                          id="notifyRecovery"
                        />
                        <label class="form-check-label" for="notifyRecovery">
                          <i class="bi bi-check-circle text-success me-2"></i>
                          <strong>Service Recovery</strong>
                          <small class="d-block text-muted">Alert when monitor comes back online</small>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">
            Cancel
          </button>
          <button type="button" class="btn btn-primary" @click="handleSubmit" :disabled="saving">
            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
            {{ saving ? 'Saving...' : (monitor ? 'Update Monitor' : 'Create Monitor') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import api from '../services/api';

export default {
  name: 'MonitorForm',
  props: {
    monitor: {
      type: Object,
      default: null,
    },
    show: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const saving = ref(false);
    const existingGroups = ref([]);

    const form = ref({
      name: '',
      type: '',
      target: '',
      description: '',
      group_name: '',
      port: null,
      interval: 60,
      timeout: 5000,
      enabled: true,
      expected_status_code: null,
      expected_keyword: '',
      docker_host: '',
      docker_container_name: '',
      database_type: '',
      database_name: '',
      database_username: '',
      database_password: '',
      notification_enabled: false,
      notification_type: 'email',
      email_recipients: '',
      notify_on_down: true,
      notify_on_recovery: true,
    });

    const targetLabel = computed(() => {
      switch (form.value.type) {
        case 'http':
        case 'https':
          return 'URL';
        case 'ping':
          return 'Hostname or IP Address';
        case 'tcp':
          return 'Hostname or IP Address';
        case 'docker':
          return 'Container Name';
        case 'database':
          return 'Database Host';
        default:
          return 'Target';
      }
    });

    const targetPlaceholder = computed(() => {
      switch (form.value.type) {
        case 'http':
          return 'http://example.com';
        case 'https':
          return 'https://example.com';
        case 'ping':
          return '192.168.1.1 or example.com';
        case 'tcp':
          return '192.168.1.1 or example.com';
        case 'docker':
          return 'my-container-name';
        case 'database':
          return 'localhost or 192.168.1.100';
        default:
          return 'Enter target';
      }
    });

    const showPort = computed(() => {
      return ['tcp', 'database'].includes(form.value.type);
    });

    const portRequired = computed(() => {
      return form.value.type === 'tcp';
    });

    const loadGroups = async () => {
      try {
        const response = await api.get('/monitors/groups/list');
        // response.data is already an array of strings ['Production', 'Development']
        existingGroups.value = response.data;
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    };

    const resetForm = () => {
      form.value = {
        name: '',
        type: '',
        target: '',
        description: '',
        group_name: '',
        port: null,
        interval: 60,
        timeout: 5000,
        enabled: true,
        expected_status_code: null,
        expected_keyword: '',
        docker_host: '',
        docker_container_name: '',
        database_type: '',
        database_name: '',
        database_username: '',
        database_password: '',
        notification_enabled: false,
        notification_type: 'email',
        email_recipients: '',
        notify_on_down: true,
        notify_on_recovery: true,
      };
    };

    const loadMonitorData = () => {
      if (props.monitor) {
        Object.keys(form.value).forEach(key => {
          if (props.monitor[key] !== undefined) {
            // Handle boolean values properly (convert 1/0 to true/false)
            if (key === 'enabled' || key === 'notification_enabled' || key === 'notify_on_down' || key === 'notify_on_recovery') {
              form.value[key] = Boolean(props.monitor[key]);
            } else {
              form.value[key] = props.monitor[key];
            }
          }
        });
      } else {
        // Reset form for new monitor
        resetForm();
      }
    };

    const handleSubmit = async () => {
      try {
        saving.value = true;

        // Clean up form data based on type
        const data = { ...form.value };

        // Trim group name to prevent duplicates from whitespace
        if (data.group_name) {
          data.group_name = data.group_name.trim();
        }

        // Set docker_container_name for docker type
        if (data.type === 'docker') {
          data.docker_container_name = data.target;
        }

        if (props.monitor) {
          await api.put(`/monitors/${props.monitor.id}`, data);
        } else {
          await api.post('/monitors', data);
        }

        emit('saved');
      } catch (error) {
        console.error('Error saving monitor:', error);
        alert('Failed to save monitor: ' + (error.response?.data?.error || error.message));
      } finally {
        saving.value = false;
      }
    };

    watch(() => props.monitor, loadMonitorData, { immediate: true });

    // Reload groups when modal opens
    watch(() => props.show, (newVal, oldVal) => {
      if (newVal) {
        loadGroups();
        // Load monitor data or reset form
        loadMonitorData();
      } else if (oldVal && !newVal) {
        // Modal is closing, reset form for next time
        resetForm();
      }
    });

    onMounted(() => {
      loadGroups();
    });

    return {
      form,
      saving,
      existingGroups,
      targetLabel,
      targetPlaceholder,
      showPort,
      portRequired,
      handleSubmit,
    };
  },
};
</script>



<style scoped>
.modal.show {
  display: block;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--border-color);
  display: flex;
  align-items: center;
}

.section-title i {
  color: var(--primary);
}

.required::after {
  content: ' *';
  color: var(--danger);
}

.notification-toggle {
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 12px;
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
}

.notification-toggle:has(.form-check-input:checked) {
  background: linear-gradient(135deg, rgba(255, 38, 103, 0.1) 0%, rgba(224, 30, 87, 0.05) 100%);
  border-color: var(--primary);
}

.form-check-input:checked {
  background-color: var(--primary);
  border-color: var(--primary);
}

.form-switch .form-check-input {
  width: 3rem;
  height: 1.5rem;
  cursor: pointer;
}

.notification-settings {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid var(--border-color);
  margin-top: 1rem;
}

.notification-triggers {
  margin-top: 1rem;
}

.trigger-card {
  background: var(--card-bg);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
  height: 100%;
}

.trigger-card:hover {
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(255, 38, 103, 0.1);
}

.trigger-card .form-check-label {
  cursor: pointer;
  user-select: none;
}

.trigger-card .form-check-input {
  cursor: pointer;
  margin-top: 0.25rem;
}

.form-text {
  display: block;
  margin-top: 0.25rem;
}

.form-label i {
  color: var(--primary);
}

/* Dark mode support */
[data-theme='dark'] .section-title {
  color: var(--text-primary);
}

[data-theme='dark'] .notification-settings,
[data-theme='dark'] .notification-toggle {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

[data-theme='dark'] .trigger-card {
  background: var(--bg-primary);
  border-color: var(--border-color);
}
</style>

