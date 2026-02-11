<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-dialog modal-lg" @click.stop>
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ session ? 'Edit Session' : 'New SSH Session' }}</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <form @submit.prevent="handleSubmit">
          <div class="modal-body">
            <!-- Basic Information -->
            <div class="form-section">
              <h6 class="section-title">Basic Information</h6>
              <div class="row">
                <div class="col-md-8 mb-3">
                  <label class="form-label">Session Name *</label>
                  <input type="text" class="form-control" v-model="form.name" placeholder="e.g., Production Server" required />
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Group</label>
                  <div class="group-input-wrapper">
                    <input
                      v-if="showCustomGroup"
                      type="text"
                      class="form-control"
                      v-model="form.group_name"
                      placeholder="Enter group name..."
                      @blur="handleGroupBlur"
                    />
                    <select
                      v-else
                      class="form-select"
                      v-model="form.group_name"
                      @change="handleGroupChange"
                    >
                      <option value="">Default</option>
                      <option v-for="group in groups" :key="group" :value="group">{{ group }}</option>
                      <option value="__new__">+ Create New Group</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Connection Details -->
            <div class="form-section">
              <h6 class="section-title">Connection Details</h6>
              <div class="row">
                <div class="col-md-8 mb-3">
                  <label class="form-label">Host *</label>
                  <input type="text" class="form-control" v-model="form.host" placeholder="192.168.1.100 or server.example.com" required />
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Port *</label>
                  <input type="number" class="form-control" v-model.number="form.port" placeholder="22" required />
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Username *</label>
                <input type="text" class="form-control" v-model="form.username" placeholder="root or admin" required />
              </div>
            </div>

            <!-- Authentication -->
            <div class="form-section">
              <h6 class="section-title">Authentication</h6>
              <div class="mb-3">
                <label class="form-label">Method *</label>
                <select class="form-select" v-model="form.auth_method" required>
                  <option value="key">SSH Key (Recommended)</option>
                  <option value="password">Password</option>
                </select>
              </div>

              <div v-if="form.auth_method === 'key'" class="mb-3">
                <label class="form-label">SSH Key *</label>
                <select class="form-select" v-model="form.ssh_key_id" required>
                  <option :value="null" disabled>Select a key...</option>
                  <option v-for="key in sshKeys" :key="key.id" :value="key.id">
                    {{ key.name }}{{ key.fingerprint ? ` (${key.fingerprint})` : '' }}
                  </option>
                </select>
                <div v-if="sshKeys.length === 0" class="alert alert-warning mt-2 mb-0">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                  <strong>No SSH keys found!</strong>
                  <p class="mb-2">You need to add an SSH key before creating a session with key authentication.</p>
                  <button type="button" class="btn btn-sm btn-warning" @click="showKeyManager = true">
                    <i class="bi bi-key-fill"></i> Add SSH Key
                  </button>
                </div>
              </div>

              <div v-if="form.auth_method === 'password'" class="mb-3">
                <label class="form-label">Password {{ session ? '' : '*' }}</label>
                <input type="password" class="form-control" v-model="form.password" :required="!session" />
                <small v-if="session" class="form-text">Leave blank to keep existing password</small>
              </div>
            </div>

            <!-- Terminal Settings -->
            <div class="form-section">
              <h6 class="section-title">Terminal Settings</h6>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Terminal Type</label>
                  <select class="form-select" v-model="form.terminal_type">
                    <option value="xterm-256color">xterm-256color (Recommended)</option>
                    <option value="xterm">xterm</option>
                    <option value="vt100">vt100</option>
                    <option value="linux">linux</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Color Scheme</label>
                  <select class="form-select" v-model="form.color_scheme">
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="solarized">Solarized</option>
                    <option value="monokai">Monokai</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Advanced Options -->
            <div class="form-section">
              <h6 class="section-title">Advanced Options</h6>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" v-model="form.keep_alive" id="keepAlive">
                    <label class="form-check-label" for="keepAlive">
                      <strong>Keep Alive</strong>
                      <small class="d-block text-muted">Send keep-alive packets to prevent timeout</small>
                    </label>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" v-model="form.auto_reconnect" id="autoReconnect">
                    <label class="form-check-label" for="autoReconnect">
                      <strong>Auto Reconnect</strong>
                      <small class="d-block text-muted">Automatically reconnect on disconnect</small>
                    </label>
                  </div>
                </div>
              </div>

              <div class="mb-0">
                <label class="form-label">Description</label>
                <textarea class="form-control" v-model="form.description" rows="2" placeholder="Optional notes about this session..."></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <!-- Test Connection Result -->
            <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
              <i class="bi" :class="testResult.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
              <span>{{ testResult.message }}</span>
            </div>
            <div class="footer-buttons">
              <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
              <button
                type="button"
                class="btn btn-info"
                @click="testConnection"
                :disabled="testingConnection || !canTestConnection"
              >
                <i class="bi" :class="testingConnection ? 'bi-hourglass-split' : 'bi-wifi'"></i>
                {{ testingConnection ? 'Testing...' : 'Test Connection' }}
              </button>
              <button type="submit" class="btn btn-primary">
                <i class="bi" :class="session ? 'bi-check-lg' : 'bi-plus-lg'"></i>
                {{ session ? 'Update Session' : 'Create Session' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <KeyManager v-if="showKeyManager" @close="handleKeyManagerClose" />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import KeyManager from './KeyManager.vue';

export default {
  name: 'SessionForm',
  components: {
    KeyManager,
  },
  props: {
    session: { type: Object, default: null },
    initialGroupName: { type: String, default: '' },
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const form = ref({
      name: '',
      group_name: '',
      host: '',
      port: 22,
      username: '',
      auth_method: 'key',
      ssh_key_id: null,
      password: '',
      description: '',
      terminal_type: 'xterm-256color',
      color_scheme: 'dark',
      keep_alive: true,
      auto_reconnect: false,
    });

    const sshKeys = ref([]);
    const groups = ref([]);
    const showKeyManager = ref(false);
    const showCustomGroup = ref(false);
    const testingConnection = ref(false);
    const testResult = ref(null);

    const loadSSHKeys = async () => {
      try {
        const response = await api.get('/ssh-keys');
        sshKeys.value = response.data;
      } catch (error) {
        console.error('Failed to load SSH keys:', error);
      }
    };

    const handleKeyManagerClose = async () => {
      showKeyManager.value = false;
      // Reload SSH keys after closing key manager
      await loadSSHKeys();
    };

    const handleGroupChange = (event) => {
      if (event.target.value === '__new__') {
        showCustomGroup.value = true;
        form.value.group_name = '';
      }
    };

    const handleGroupBlur = () => {
      if (!form.value.group_name || form.value.group_name.trim() === '') {
        showCustomGroup.value = false;
        form.value.group_name = '';
      }
    };

    const loadGroups = async () => {
      try {
        // Load groups from the ssh_groups table
        const response = await api.get('/ssh-groups');
        // Extract just the group names for the dropdown
        groups.value = response.data.map(g => g.name);
      } catch (error) {
        console.error('Failed to load groups:', error);
      }
    };

    const handleOverlayClick = () => emit('close');

    const canTestConnection = computed(() => {
      return form.value.host &&
             form.value.username &&
             ((form.value.auth_method === 'key' && form.value.ssh_key_id) ||
              (form.value.auth_method === 'password' && form.value.password));
    });

    const testConnection = async () => {
      testingConnection.value = true;
      testResult.value = null;

      try {
        console.log('🔍 Testing SSH connection...');

        const response = await api.post('/ssh-sessions/test-connection', {
          host: form.value.host,
          port: form.value.port || 22,
          username: form.value.username,
          auth_method: form.value.auth_method,
          ssh_key_id: form.value.ssh_key_id,
          password: form.value.password,
        });

        if (response.data.success) {
          testResult.value = {
            success: true,
            message: `✅ ${response.data.message}`,
          };
          console.log('✅ Connection test successful');
        } else {
          testResult.value = {
            success: false,
            message: `❌ ${response.data.error}`,
          };
          console.error('❌ Connection test failed:', response.data.error);
        }
      } catch (error) {
        console.error('❌ Connection test error:', error);

        let errorMessage = 'Connection test failed';
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        testResult.value = {
          success: false,
          message: `❌ ${errorMessage}`,
        };
      } finally {
        testingConnection.value = false;

        // Auto-hide result after 5 seconds
        setTimeout(() => {
          testResult.value = null;
        }, 5000);
      }
    };

    const handleSubmit = async () => {
      try {
        console.log('📝 Submitting session form:', form.value);
        console.log('📝 Keep Alive value:', form.value.keep_alive, 'Type:', typeof form.value.keep_alive);
        console.log('📝 Auto Reconnect value:', form.value.auto_reconnect, 'Type:', typeof form.value.auto_reconnect);

        // Validate required fields
        if (!form.value.name || !form.value.host || !form.value.username) {
          alert('Please fill in all required fields (Name, Host, Username)');
          return;
        }

        if (form.value.auth_method === 'key' && !form.value.ssh_key_id) {
          alert('Please select an SSH key or switch to password authentication');
          return;
        }

        if (form.value.auth_method === 'password' && !form.value.password && !props.session) {
          alert('Please enter a password');
          return;
        }

        // If a new group name is entered, create it in ssh_groups table first
        if (form.value.group_name && form.value.group_name.trim() && !groups.value.includes(form.value.group_name)) {
          try {
            console.log('📝 Creating new group:', form.value.group_name);
            await api.post('/ssh-groups', {
              name: form.value.group_name.trim(),
              description: 'User created group',
              color: '#007acc',
              icon: 'folder'
            });
            console.log('✅ Group created successfully');
          } catch (groupError) {
            // If group already exists (409), that's fine, continue
            if (groupError.response?.status !== 409) {
              console.error('❌ Failed to create group:', groupError);
              // Don't fail the session creation, just log the error
            }
          }
        }

        let response;
        if (props.session) {
          console.log('📤 Updating session:', props.session.id);
          response = await api.put(`/ssh-sessions/${props.session.id}`, form.value);
        } else {
          console.log('📤 Creating new session');
          response = await api.post('/ssh-sessions', form.value);
        }

        console.log('✅ Session saved successfully:', response.data);
        console.log('✅ Saved keep_alive:', response.data.keep_alive);
        console.log('✅ Saved auto_reconnect:', response.data.auto_reconnect);
        emit('saved');
      } catch (error) {
        console.error('❌ Failed to save session:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: error.config
        });

        let errorMessage = 'Failed to save session';

        if (error.code === 'ERR_NETWORK') {
          errorMessage = '❌ Network Error\n\nCannot connect to the server. Please make sure:\n1. The backend server is running\n2. Check the terminal for server status\n3. Try refreshing the page';
        } else if (error.response?.data?.error) {
          errorMessage = `❌ ${error.response.data.error}`;
        } else if (error.message) {
          errorMessage = `❌ ${error.message}`;
        }

        alert(errorMessage);
      }
    };

    onMounted(async () => {
      await loadSSHKeys();
      await loadGroups();

      if (props.session) {
        form.value = {
          ...props.session,
          ssh_key_id: props.session.ssh_key_id ? Number(props.session.ssh_key_id) : null,
          password: '',
          // Convert database values to boolean for checkboxes
          keep_alive: props.session.keep_alive > 0, // Convert number to boolean (30 -> true, 0 -> false)
          auto_reconnect: Boolean(props.session.auto_reconnect), // Convert 1/0 to boolean
        };
      } else if (props.initialGroupName) {
        // Pre-fill group name for new sessions
        form.value.group_name = props.initialGroupName;
        showCustomGroup.value = true;
      }
    });

    return {
      form,
      sshKeys,
      groups,
      showKeyManager,
      showCustomGroup,
      testingConnection,
      testResult,
      canTestConnection,
      handleOverlayClick,
      handleSubmit,
      handleKeyManagerClose,
      handleGroupChange,
      handleGroupBlur,
      testConnection,
    };
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  backdrop-filter: blur(4px);
}

.modal-dialog {
  max-width: 700px;
  width: 90%;
}

.modal-content {
  background: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  border-bottom: 1px solid var(--border-color);
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 16px 16px 0 0;
}

.modal-title {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 1.25rem;
}

.btn-close {
  filter: none;
  background: transparent;
  opacity: 0.7;
}

.btn-close:hover {
  opacity: 1;
}

.modal-body {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-footer {
  border-top: 1px solid var(--border-color);
  padding: 1.25rem 1.5rem;
  background: var(--bg-secondary);
  border-radius: 0 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  width: 100%;
}

/* Form Sections */
.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.form-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title::before {
  content: '';
  width: 3px;
  height: 1rem;
  background: var(--primary);
  border-radius: 2px;
}

/* Form Controls */
.form-label {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-control,
.form-select {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
  transition: all 0.2s;
}

.form-select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23ff2667' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 16px 12px;
  padding-right: 2.5rem;
}

.form-select option {
  background: var(--card-bg);
  color: var(--text-primary);
  padding: 0.5rem;
}

.form-control:focus,
.form-select:focus {
  background: var(--card-bg);
  border-color: var(--primary);
  color: var(--text-primary);
  box-shadow: 0 0 0 0.2rem rgba(255, 38, 103, 0.15);
}

.form-control::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

.text-warning {
  color: #f9af4f !important;
}

.form-text {
  color: var(--text-secondary);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* Alert */
.alert {
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid;
}

.alert-warning {
  background: rgba(249, 175, 79, 0.1);
  border-color: rgba(249, 175, 79, 0.3);
  color: var(--text-primary);
}

.alert i {
  color: #f9af4f;
  margin-right: 0.5rem;
}

.alert strong {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.alert p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.alert .btn {
  margin-top: 0.5rem;
}

.btn-warning {
  background: #f9af4f;
  border-color: #f9af4f;
  color: #000;
  font-weight: 600;
}

.btn-warning:hover {
  background: #e3b341;
  border-color: #e3b341;
  color: #000;
}

/* Form Switches */
.form-check-input {
  width: 2.5rem;
  height: 1.25rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  cursor: pointer;
}

.form-check-input:checked {
  background-color: var(--primary);
  border-color: var(--primary);
}

.form-check-input:focus {
  box-shadow: 0 0 0 0.2rem rgba(255, 38, 103, 0.15);
}

.form-check-label {
  margin-left: 0.5rem;
  cursor: pointer;
}

.form-check-label strong {
  color: var(--text-primary);
  display: block;
  margin-bottom: 0.125rem;
}

/* Buttons */
.btn {
  border-radius: 8px;
  padding: 0.625rem 1.25rem;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: var(--primary);
  border-color: var(--primary);
}

.btn-primary:hover {
  background: var(--primary-dark);
  border-color: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 38, 103, 0.3);
}

.btn-secondary {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--card-bg);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.btn-info {
  background: #17a2b8;
  border-color: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
  border-color: #117a8b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
}

.btn-info:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Test Result */
.test-result {
  width: 100%;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  animation: slideIn 0.3s ease-out;
}

.test-result.success {
  background: rgba(40, 167, 69, 0.12);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.25);
}

.test-result.error {
  background: rgba(220, 53, 69, 0.12);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.25);
}

.test-result i {
  font-size: 1.125rem;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dark mode specific adjustments */
[data-theme='dark'] .modal-content {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

[data-theme='dark'] .btn-close {
  filter: invert(1);
}

/* Group input wrapper */
.group-input-wrapper {
  position: relative;
}

.group-input-wrapper .form-control {
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
