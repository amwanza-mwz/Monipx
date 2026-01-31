<template>
  <div class="team-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <i class="bi bi-people-fill me-3"></i>
            Team Management
          </h1>
          <p class="page-subtitle">Manage team members and control access to your workspace</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" @click="showInviteModal = true">
            <i class="bi bi-person-plus me-2"></i>
            Invite Member
          </button>
        </div>
      </div>
    </div>

    <div class="page-content">
      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="bi bi-people"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ members.length }}</span>
            <span class="stat-label">Total Members</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active">
            <i class="bi bi-person-check"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ activeMembers }}</span>
            <span class="stat-label">Active</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pending">
            <i class="bi bi-envelope"></i>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ invitations.length }}</span>
            <span class="stat-label">Pending Invites</span>
          </div>
        </div>
      </div>

      <!-- Team Members Table -->
      <div class="content-card">
        <div class="card-header">
          <h2 class="card-title">Team Members</h2>
          <div class="card-actions">
            <input
              type="text"
              class="search-input"
              v-model="searchQuery"
              placeholder="Search members..."
            />
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="text-center py-4">
                  <div class="spinner-border text-primary"></div>
                </td>
              </tr>
              <tr v-else-if="filteredMembers.length === 0">
                <td colspan="6" class="text-center py-4 text-muted">
                  No team members found
                </td>
              </tr>
              <tr v-for="member in filteredMembers" :key="member.id">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">
                      {{ member.username.charAt(0).toUpperCase() }}
                    </div>
                    <div class="user-info">
                      <span class="user-name">{{ member.username }}</span>
                      <span class="user-email">{{ member.email || 'No email' }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <select
                    class="role-select"
                    :value="member.role"
                    @change="updateRole(member.id, $event.target.value)"
                    :disabled="member.id === currentUserId"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td>
                  <span :class="['status-badge', `status-${member.status}`]">
                    {{ member.status }}
                  </span>
                </td>
                <td>{{ formatDate(member.lastLogin) }}</td>
                <td>{{ formatDate(member.createdAt) }}</td>
                <td>
                  <div class="action-buttons">
                    <button
                      v-if="member.status === 'active' && member.id !== currentUserId"
                      class="btn-action btn-disable"
                      @click="disableMember(member)"
                      title="Disable"
                    >
                      <i class="bi bi-pause-circle"></i>
                    </button>
                    <button
                      v-if="member.status === 'disabled'"
                      class="btn-action btn-enable"
                      @click="enableMember(member)"
                      title="Enable"
                    >
                      <i class="bi bi-play-circle"></i>
                    </button>
                    <button
                      v-if="member.id !== currentUserId"
                      class="btn-action btn-delete"
                      @click="deleteMember(member)"
                      title="Delete"
                    >
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pending Invitations -->
      <div class="content-card" v-if="invitations.length > 0">
        <div class="card-header">
          <h2 class="card-title">Pending Invitations</h2>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Invited By</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invite in invitations" :key="invite.id">
                <td>{{ invite.email }}</td>
                <td>
                  <span class="role-badge">{{ invite.role }}</span>
                </td>
                <td>{{ invite.invitedBy }}</td>
                <td>{{ formatDate(invite.expiresAt) }}</td>
                <td>
                  <button class="btn-action btn-delete" @click="revokeInvite(invite)">
                    <i class="bi bi-x-circle"></i> Revoke
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Invite Modal -->
    <div v-if="showInviteModal" class="modal-overlay" @click="showInviteModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="bi bi-person-plus me-2"></i>
            Add Team Member
          </h3>
          <button class="btn-close" @click="showInviteModal = false">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="sendInvite">
            <div class="form-group">
              <label>Username</label>
              <input
                type="text"
                class="form-control"
                v-model="inviteForm.username"
                placeholder="Enter username"
                required
              />
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input
                type="email"
                class="form-control"
                v-model="inviteForm.email"
                placeholder="Enter email address"
                required
              />
            </div>
            <div class="form-group">
              <label>Role</label>
              <select class="form-select" v-model="inviteForm.role">
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
              <small class="form-text">
                <strong>Admin:</strong> Full access |
                <strong>Manager:</strong> Manage sessions & keys |
                <strong>Member:</strong> Connect & create |
                <strong>Viewer:</strong> View only
              </small>
            </div>
            <div class="form-group">
              <label>Password</label>
              <div class="password-input-group">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control"
                  v-model="inviteForm.password"
                  placeholder="Enter password or generate"
                  required
                  minlength="8"
                />
                <button type="button" class="btn-icon" @click="showPassword = !showPassword" title="Toggle visibility">
                  <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
                <button type="button" class="btn-generate" @click="generatePassword" title="Generate random password">
                  <i class="bi bi-arrow-repeat"></i>
                </button>
              </div>
              <small class="form-text">
                Minimum 8 characters. Click <i class="bi bi-arrow-repeat"></i> to generate a random password.
              </small>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="showInviteModal = false">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="sendingInvite">
                <span v-if="sendingInvite" class="spinner-border spinner-border-sm me-2"></span>
                Create Member
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Password Modal -->
    <div v-if="showPasswordModal" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="bi bi-check-circle-fill me-2 text-success"></i>
            Member Created
          </h3>
        </div>
        <div class="modal-body">
          <div class="password-info">
            <p class="mb-3">
              <strong>{{ createdUser.username }}</strong> has been added to your team.
            </p>
            <div class="password-box">
              <label>Temporary Password</label>
              <div class="password-display">
                <code>{{ createdUser.tempPassword }}</code>
                <button type="button" class="btn-copy" @click="copyPassword" :title="copied ? 'Copied!' : 'Copy'">
                  <i :class="copied ? 'bi bi-check' : 'bi bi-clipboard'"></i>
                </button>
              </div>
              <small class="form-text text-warning">
                <i class="bi bi-exclamation-triangle me-1"></i>
                Share this password securely with the user. They should change it after first login.
              </small>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-primary" @click="closePasswordModal">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

export default {
  name: 'TeamManagement',
  setup() {
    const members = ref([]);
    const invitations = ref([]);
    const loading = ref(true);
    const searchQuery = ref('');
    const showInviteModal = ref(false);
    const showPasswordModal = ref(false);
    const sendingInvite = ref(false);
    const currentUserId = ref(1); // TODO: Get from auth
    const copied = ref(false);
    const showPassword = ref(false);

    const inviteForm = ref({
      username: '',
      email: '',
      role: 'member',
      password: '',
    });

    // Generate a random password
    function generatePassword() {
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      inviteForm.value.password = password;
      showPassword.value = true; // Show the generated password
    }

    const createdUser = ref({
      username: '',
      tempPassword: '',
    });

    const activeMembers = computed(() =>
      members.value.filter(m => m.status === 'active').length
    );

    const filteredMembers = computed(() => {
      if (!searchQuery.value) return members.value;
      const query = searchQuery.value.toLowerCase();
      return members.value.filter(m =>
        m.username.toLowerCase().includes(query) ||
        (m.email && m.email.toLowerCase().includes(query))
      );
    });

    async function loadMembers() {
      try {
        loading.value = true;
        const response = await api.get('/team');
        members.value = response.data.members;
      } catch (error) {
        console.error('Failed to load team members:', error);
      } finally {
        loading.value = false;
      }
    }

    async function loadInvitations() {
      try {
        const response = await api.get('/team/invitations');
        invitations.value = response.data.invitations;
      } catch (error) {
        console.error('Failed to load invitations:', error);
      }
    }

    async function sendInvite() {
      try {
        sendingInvite.value = true;
        const response = await api.post('/team/invite', inviteForm.value);

        // Show password modal with the generated password
        createdUser.value = {
          username: response.data.user.username,
          tempPassword: response.data.tempPassword,
        };

        showInviteModal.value = false;
        showPasswordModal.value = true;
        inviteForm.value = { username: '', email: '', role: 'member', password: '' };
        showPassword.value = false;
        await loadMembers();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to create team member');
      } finally {
        sendingInvite.value = false;
      }
    }

    function closePasswordModal() {
      showPasswordModal.value = false;
      createdUser.value = { username: '', tempPassword: '' };
      copied.value = false;
    }

    async function copyPassword() {
      try {
        await navigator.clipboard.writeText(createdUser.value.tempPassword);
        copied.value = true;
        setTimeout(() => {
          copied.value = false;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }

    async function updateRole(memberId, newRole) {
      try {
        await api.put(`/team/${memberId}/role`, { role: newRole });
        await loadMembers();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to update role');
      }
    }

    async function disableMember(member) {
      if (!confirm(`Disable ${member.username}? They won't be able to login.`)) return;
      try {
        await api.put(`/team/${member.id}/disable`);
        await loadMembers();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to disable member');
      }
    }

    async function enableMember(member) {
      try {
        await api.put(`/team/${member.id}/enable`);
        await loadMembers();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to enable member');
      }
    }

    async function deleteMember(member) {
      if (!confirm(`Delete ${member.username}? This action cannot be undone.`)) return;
      try {
        await api.delete(`/team/${member.id}`);
        await loadMembers();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to delete member');
      }
    }

    async function revokeInvite(invite) {
      if (!confirm(`Revoke invitation for ${invite.email}?`)) return;
      try {
        await api.delete(`/team/invitations/${invite.id}`);
        await loadInvitations();
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to revoke invitation');
      }
    }

    function formatDate(dateStr) {
      if (!dateStr) return 'Never';
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    onMounted(() => {
      loadMembers();
      loadInvitations();
    });

    return {
      members,
      invitations,
      loading,
      searchQuery,
      showInviteModal,
      showPasswordModal,
      sendingInvite,
      currentUserId,
      inviteForm,
      createdUser,
      copied,
      activeMembers,
      filteredMembers,
      sendInvite,
      updateRole,
      disableMember,
      enableMember,
      deleteMember,
      revokeInvite,
      formatDate,
      closePasswordModal,
      copyPassword,
      showPassword,
      generatePassword,
    };
  },
};
</script>

<style scoped>
.team-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.page-header {
  background: linear-gradient(135deg, #FF2667 0%, #d91e63 100%);
  padding: 2.5rem 3rem;
  box-shadow: 0 4px 20px rgba(255, 38, 103, 0.3);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 3rem;
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 38, 103, 0.1);
  color: #FF2667;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-icon.active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.stat-icon.pending {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* Cards */
.content-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.search-input {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
  width: 250px;
}

/* Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  background: var(--bg-secondary);
}

.data-table td {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  color: var(--text-primary);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF2667 0%, #d91e63 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.user-name {
  font-weight: 500;
  display: block;
}

.user-email {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.role-select {
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  background: rgba(255, 38, 103, 0.1);
  color: #FF2667;
  text-transform: capitalize;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-active {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-disabled {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

.status-pending {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-disable {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.btn-disable:hover {
  background: rgba(245, 158, 11, 0.2);
}

.btn-enable {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.btn-enable:hover {
  background: rgba(16, 185, 129, 0.2);
}

.btn-delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
}

.btn-close:hover {
  background: var(--bg-secondary);
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-control,
.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.form-text {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

/* Password Modal */
.password-info {
  text-align: center;
}

.password-box {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.25rem;
  margin-top: 1rem;
}

.password-box label {
  display: block;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.password-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.password-display code {
  flex: 1;
  font-size: 1.125rem;
  font-family: 'Menlo', 'Monaco', monospace;
  color: #FF2667;
  background: none;
  padding: 0;
}

.btn-copy {
  background: rgba(255, 38, 103, 0.1);
  border: none;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  color: #FF2667;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-copy:hover {
  background: rgba(255, 38, 103, 0.2);
}

.text-success {
  color: #10b981 !important;
}

.text-warning {
  color: #f59e0b !important;
}

/* Password Input Group */
.password-input-group {
  display: flex;
  gap: 0.5rem;
}

.password-input-group .form-control {
  flex: 1;
}

.btn-icon,
.btn-generate {
  width: 42px;
  height: 42px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover,
.btn-generate:hover {
  background: rgba(255, 38, 103, 0.1);
  border-color: #FF2667;
  color: #FF2667;
}

.btn-generate {
  background: rgba(255, 38, 103, 0.1);
  color: #FF2667;
  border-color: rgba(255, 38, 103, 0.3);
}

.btn-generate:hover {
  background: rgba(255, 38, 103, 0.2);
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .page-content {
    padding: 1rem;
  }

  .search-input {
    width: 100%;
  }
}
</style>
