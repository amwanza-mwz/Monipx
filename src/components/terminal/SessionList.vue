<template>
  <div class="session-list">
    <!-- Modern Header -->
    <div class="modern-header">
      <div class="header-title">
        <i class="bi bi-terminal-fill"></i>
        <h5>Sessions</h5>
      </div>
      <button class="btn-new-session" @click="$emit('new-session')" title="New Session">
        <i class="bi bi-plus-lg"></i>
      </button>
    </div>

    <!-- Modern Action Bar -->
    <div class="action-bar">
      <button class="action-btn" @click="openGroupManager" title="Manage Groups">
        <i class="bi bi-folder2"></i>
        <span>Groups</span>
      </button>
      <button class="action-btn" @click="showKeyManager = true" title="SSH Keys">
        <i class="bi bi-key-fill"></i>
        <span>Keys</span>
      </button>
    </div>

    <!-- Modern Search Box -->
    <div class="modern-search">
      <i class="bi bi-search"></i>
      <input
        type="text"
        class="search-input"
        placeholder="Search sessions..."
        v-model="searchQuery"
      />
      <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''">
        <i class="bi bi-x"></i>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading sessions...</p>
    </div>

    <!-- Session Groups -->
    <div v-else class="session-groups">
      <div v-for="group in filteredGroups" :key="group.name" class="modern-group">
        <div class="modern-group-header" @click="toggleGroup(group.name)">
          <div class="group-header-left">
            <i class="bi chevron-icon" :class="group.expanded ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
            <i class="bi bi-folder-fill group-folder-icon"></i>
            <span class="modern-group-name">{{ group.name }}</span>
          </div>
          <span class="session-count">{{ group.sessions.length }}</span>
        </div>

        <div v-show="group.expanded" class="modern-group-sessions">
          <div
            v-for="session in group.sessions"
            :key="session.id"
            class="modern-session-item"
            :class="{ active: selectedSessionId === session.id }"
            @click="selectSession(session)"
            @dblclick="$emit('connect', session)"
          >
            <div class="session-main">
              <div class="session-icon-modern">
                <i class="bi bi-terminal-fill"></i>
              </div>
              <div class="session-info-modern">
                <div class="session-name-modern">{{ session.name }}</div>
                <div class="session-details-modern">
                  <i class="bi bi-person-fill"></i>
                  {{ session.username }}@{{ session.host }}:{{ session.port }}
                </div>
              </div>
            </div>
            <div class="session-actions-modern">
              <button class="action-icon-btn connect-btn" @click.stop="$emit('connect', session)" title="Connect">
                <i class="bi bi-play-circle-fill"></i>
              </button>
              <button class="action-icon-btn edit-btn" @click.stop="$emit('edit', session)" title="Edit">
                <i class="bi bi-pencil-fill"></i>
              </button>
              <button class="action-icon-btn delete-btn" @click.stop="deleteSession(session)" title="Delete">
                <i class="bi bi-trash-fill"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredGroups.length === 0" class="modern-empty-state">
        <div class="empty-icon">
          <i class="bi bi-inbox"></i>
        </div>
        <h6>No sessions found</h6>
        <p>Create your first SSH session to get started</p>
        <button class="btn-create-first" @click="$emit('new-session')">
          <i class="bi bi-plus-circle-fill"></i>
          Create Session
        </button>
      </div>
    </div>

    <!-- Modern Group Manager Modal -->
    <div v-if="showGroupManager" class="modern-modal-overlay" @click="closeGroupManager">
      <div class="modern-modal-dialog" @click.stop>
        <div class="modern-modal-content">
          <!-- Modal Header -->
          <div class="modern-modal-header">
            <div class="modal-header-left">
              <i class="bi bi-folder2 header-icon"></i>
              <h5 class="modern-modal-title">Manage Groups</h5>
            </div>
            <button type="button" class="modern-btn-close" @click="closeGroupManager">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modern-modal-body">
            <!-- Existing Groups -->
            <div class="modern-section">
              <label class="modern-label">Existing Groups</label>
              <div class="modern-group-list">
                <div v-for="group in groupList" :key="group.name" class="modern-group-card">
                  <div class="group-card-left">
                    <i class="bi bi-folder-fill group-card-icon"></i>
                    <div class="group-card-info">
                      <span class="group-card-name">{{ group.name }}</span>
                      <span class="group-card-count">{{ group.count }} session{{ group.count !== 1 ? 's' : '' }}</span>
                    </div>
                  </div>
                  <button
                    class="modern-btn-add-session"
                    @click="createSessionInGroup(group.name)"
                    title="Add session to this group"
                  >
                    <i class="bi bi-plus-circle-fill"></i>
                    <span>Add Session</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Create New Group -->
            <div class="modern-section">
              <label class="modern-label">Create New Group</label>
              <div class="modern-input-group">
                <input
                  type="text"
                  class="modern-input"
                  placeholder="Enter new group name..."
                  v-model="newGroupName"
                  @keyup.enter="createGroup"
                />
                <button class="modern-btn-create" @click="createGroup">
                  <i class="bi bi-plus-lg"></i>
                  Create Group
                </button>
              </div>
              <small class="modern-hint">Create an empty group, then add sessions to it later</small>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modern-modal-footer">
            <button type="button" class="modern-btn-secondary" @click="closeGroupManager">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <KeyManager v-if="showKeyManager" @close="showKeyManager = false" />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import KeyManager from './KeyManager.vue';

export default {
  name: 'SessionList',
  components: {
    KeyManager,
  },
  props: {
    selectedSessionId: { type: Number, default: null },
  },
  emits: ['new-session', 'connect', 'edit', 'select'],
  setup(props, { emit }) {
    const sessions = ref([]);
    const loading = ref(false);
    const searchQuery = ref('');

    // Load expanded groups from localStorage, default to all expanded
    const loadExpandedGroups = () => {
      try {
        const saved = localStorage.getItem('expandedGroups');
        if (saved) {
          return new Set(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load expanded groups:', error);
      }
      // Default: all groups expanded (empty Set means all expanded)
      return new Set();
    };

    const expandedGroups = ref(loadExpandedGroups());
    const showGroupManager = ref(false);
    const showKeyManager = ref(false);
    const newGroupName = ref('');

    const loadSessions = async () => {
      loading.value = true;
      try {
        const response = await api.get('/ssh-sessions');
        sessions.value = response.data;
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        loading.value = false;
      }
    };

    const filteredGroups = computed(() => {
      const groupMap = new Map();
      sessions.value.forEach((session) => {
        const groupName = session.group_name || 'Default';
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase();
          const matches = session.name.toLowerCase().includes(query) ||
                         session.host.toLowerCase().includes(query) ||
                         session.username.toLowerCase().includes(query);
          if (!matches) return;
        }
        if (!groupMap.has(groupName)) {
          groupMap.set(groupName, {
            name: groupName,
            sessions: [],
            // If expandedGroups is empty, all groups are expanded by default
            // Otherwise, check if this specific group is in the set
            expanded: expandedGroups.value.size === 0 ? true : expandedGroups.value.has(groupName),
          });
        }
        groupMap.get(groupName).sessions.push(session);
      });
      return Array.from(groupMap.values()).sort((a, b) => {
        if (a.name === 'Default') return -1;
        if (b.name === 'Default') return 1;
        return a.name.localeCompare(b.name);
      });
    });

    const groupList = computed(() => {
      const groupMap = new Map();
      sessions.value.forEach((session) => {
        const groupName = session.group_name || 'Default';
        if (!groupMap.has(groupName)) {
          groupMap.set(groupName, { name: groupName, count: 0 });
        }
        groupMap.get(groupName).count++;
      });
      return Array.from(groupMap.values()).sort((a, b) => {
        if (a.name === 'Default') return -1;
        if (b.name === 'Default') return 1;
        return a.name.localeCompare(b.name);
      });
    });

    const toggleGroup = (groupName) => {
      // If we're starting with all expanded (size === 0), we need to populate the set
      if (expandedGroups.value.size === 0) {
        // Get all group names
        const allGroups = new Set();
        sessions.value.forEach(session => {
          allGroups.add(session.group_name || 'Default');
        });
        // Add all groups except the one being collapsed
        allGroups.forEach(group => {
          if (group !== groupName) {
            expandedGroups.value.add(group);
          }
        });
      } else {
        // Normal toggle behavior
        if (expandedGroups.value.has(groupName)) {
          expandedGroups.value.delete(groupName);
        } else {
          expandedGroups.value.add(groupName);
        }
      }

      // Save to localStorage
      try {
        localStorage.setItem('expandedGroups', JSON.stringify(Array.from(expandedGroups.value)));
      } catch (error) {
        console.error('Failed to save expanded groups:', error);
      }
    };

    const selectSession = (session) => emit('select', session);
    const openGroupManager = () => { showGroupManager.value = true; };
    const closeGroupManager = () => {
      showGroupManager.value = false;
      newGroupName.value = '';
    };

    const createGroup = async () => {
      if (!newGroupName.value.trim()) {
        alert('Please enter a group name');
        return;
      }

      const groupName = newGroupName.value.trim();

      try {
        // Create the group via API
        await api.post('/ssh-groups', {
          name: groupName,
          description: 'User created group',
          color: '#007acc',
          icon: 'folder'
        });

        // Reload sessions to refresh the group list
        await loadSessions();

        // Clear input and close modal
        newGroupName.value = '';
        closeGroupManager();

        // Show success message
        alert(`Group "${groupName}" created successfully!`);
      } catch (error) {
        console.error('Failed to create group:', error);
        if (error.response?.status === 409) {
          alert('A group with this name already exists');
        } else {
          alert('Failed to create group: ' + (error.response?.data?.error || error.message));
        }
      }
    };

    const createSessionInGroup = (groupName) => {
      // Close the group manager modal
      closeGroupManager();

      // Emit event to open session form with this group pre-filled
      emit('new-session-with-group', groupName);
    };

    onMounted(() => loadSessions());

    return {
      sessions, loading, searchQuery, filteredGroups, groupList,
      showGroupManager, showKeyManager, newGroupName, toggleGroup, selectSession,
      openGroupManager, closeGroupManager, createGroup, createSessionInGroup, loadSessions,
    };
  },
};
</script>

<style scoped>
.session-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0d1117;
}

/* Modern Header */
.modern-header {
  padding: 1rem;
  background: #252526;
  border-bottom: 1px solid #3e3e3e;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-title i {
  font-size: 1.25rem;
  color: #ff2667;
}

.header-title h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #cccccc;
}

.btn-new-session {
  background: #ff2667;
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.btn-new-session:hover {
  background: #e01f5a;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 38, 103, 0.3);
}

.btn-new-session:active {
  transform: scale(0.95);
}

/* Modern Action Bar */
.action-bar {
  padding: 0.75rem 1rem;
  background: #1e1e1e;
  border-bottom: 1px solid #3e3e3e;
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  flex: 1;
  padding: 0.625rem 0.75rem;
  background: #252526;
  border: 1px solid #3e3e3e;
  border-radius: 6px;
  color: #cccccc;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.action-btn:hover {
  background: #2d2d2d;
  border-color: #ff2667;
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 38, 103, 0.2);
}

.action-btn:active {
  transform: translateY(0);
}

.action-btn i {
  font-size: 1rem;
  color: #8a8a8a;
}

.action-btn:hover i {
  color: #ff2667;
}

/* Only folder icon stays blue */
.action-btn i.bi-folder2 {
  color: #007acc;
}

.action-btn:hover i.bi-folder2 {
  color: #007acc;
}

/* Modern Search Box */
.modern-search {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #3e3e3e;
  background: #1e1e1e;
  position: relative;
}

.modern-search i.bi-search {
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #858585;
  font-size: 0.875rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.625rem 0.875rem 0.625rem 2.25rem;
  background: #252526;
  border: 1px solid #3e3e3e;
  border-radius: 6px;
  color: #cccccc;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.search-input::placeholder {
  color: #858585;
}

.search-input:focus {
  outline: none;
  background: #2d2d2d;
  border-color: #007acc;
  box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.1);
}

.clear-search {
  position: absolute;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #858585;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.2s;
}

.clear-search:hover {
  background: #3e3e3e;
  color: #cccccc;
}

/* Loading State */
.loading-state {
  padding: 3rem 1rem;
  text-align: center;
  color: #858585;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #3e3e3e;
  border-top-color: #007acc;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* Session Groups */
.session-groups {
  flex: 1;
  overflow-y: auto;
  background: #1e1e1e;
}

.modern-group {
  border-bottom: 1px solid #2d2d2d;
}

.modern-group-header {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: #252526;
  transition: all 0.2s;
}

.modern-group-header:hover {
  background: #2d2d2d;
}

.group-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.chevron-icon {
  font-size: 0.75rem;
  color: #858585;
  transition: transform 0.2s;
}

.group-folder-icon {
  font-size: 1rem;
  color: #007acc;
}

.modern-group-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: #cccccc;
}

.session-count {
  background: #3e3e3e;
  color: #858585;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.modern-group-sessions {
  background: #1e1e1e;
}

/* Modern Session Items */
.modern-session-item {
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #2d2d2d;
  transition: all 0.2s;
  position: relative;
}

.modern-session-item:hover {
  background: #252526;
}

.modern-session-item.active {
  background: #2d2d2d;
  border-left: 3px solid #ff2667;
  padding-left: calc(2.5rem - 3px);
}

.modern-session-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #ff2667 0%, #e01f5a 100%);
}

.session-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.session-icon-modern {
  width: 32px;
  height: 32px;
  background: #ff2667;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.session-icon-modern i {
  font-size: 0.875rem;
  color: white;
}

.modern-session-item.active .session-icon-modern {
  background: linear-gradient(135deg, #ff2667 0%, #e01f5a 100%);
  box-shadow: 0 2px 8px rgba(255, 38, 103, 0.3);
}

.session-info-modern {
  flex: 1;
  min-width: 0;
}

.session-name-modern {
  font-weight: 600;
  font-size: 0.875rem;
  color: #cccccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.25rem;
}

.session-details-modern {
  font-size: 0.75rem;
  color: #858585;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.session-details-modern i {
  font-size: 0.625rem;
}

/* Modern Session Actions */
.session-actions-modern {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.modern-session-item:hover .session-actions-modern {
  opacity: 1;
}

.action-icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #858585;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.action-icon-btn:hover {
  background: #3e3e3e;
  color: #ffffff;
  transform: scale(1.1);
}

.action-icon-btn:active {
  transform: scale(0.95);
}

.connect-btn:hover {
  background: #28a745;
  color: white;
}

.edit-btn:hover {
  background: #007acc;
  color: white;
}

.delete-btn:hover {
  background: #dc3545;
  color: white;
}

/* Modern Empty State */
.modern-empty-state {
  padding: 4rem 2rem;
  text-align: center;
  color: #858585;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.3;
  color: #858585;
}

.modern-empty-state h6 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #cccccc;
  margin-bottom: 0.5rem;
}

.modern-empty-state p {
  margin-bottom: 1.5rem;
  color: #858585;
  font-size: 0.875rem;
}

.btn-create-first {
  padding: 0.75rem 1.5rem;
  background: #ff2667;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-create-first:hover {
  background: #e01f5a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 38, 103, 0.3);
}

.btn-create-first:active {
  transform: translateY(0);
}

.btn-create-first i {
  font-size: 1rem;
}

/* Modern Group Manager Modal */
.modern-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modern-modal-dialog {
  max-width: 600px;
  width: 90%;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modern-modal-content {
  background: #1e1e1e;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  border: 1px solid #3e3e3e;
}

.modern-modal-header {
  padding: 1.5rem;
  background: #252526;
  border-bottom: 1px solid #3e3e3e;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-icon {
  font-size: 1.5rem;
  color: #007acc;
}

.modern-modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #e6e1cf;
}

.modern-btn-close {
  background: transparent;
  border: none;
  color: #858585;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modern-btn-close:hover {
  background: #3e3e3e;
  color: #ffffff;
}

.modern-btn-close i {
  font-size: 1rem;
}

.modern-modal-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.modern-section {
  margin-bottom: 1.5rem;
}

.modern-section:last-child {
  margin-bottom: 0;
}

.modern-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #cccccc;
  margin-bottom: 0.75rem;
}

.modern-group-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  background: #0a0e14;
  border-radius: 8px;
  border: 1px solid #1c2128;
}

.modern-group-card {
  padding: 1rem;
  background: #252526;
  border: 1px solid #3e3e3e;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
}

.modern-group-card:hover {
  background: #2d2d2d;
  border-color: #ff2667;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 38, 103, 0.1);
}

.group-card-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.group-card-icon {
  font-size: 1.5rem;
  color: #007acc;
}

.group-card-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.group-card-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #e6e1cf;
}

.group-card-count {
  font-size: 0.75rem;
  color: #8a8a8a;
}

.modern-btn-add-session {
  padding: 0.5rem 1rem;
  background: #ff2667;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modern-btn-add-session:hover {
  background: #e01f5a;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 38, 103, 0.3);
}

.modern-btn-add-session:active {
  transform: scale(0.95);
}

.modern-btn-add-session i {
  font-size: 1rem;
}

.modern-input-group {
  display: flex;
  gap: 0.5rem;
}

.modern-input {
  flex: 1;
  padding: 0.75rem 1rem;
  background: #252526;
  border: 1px solid #3e3e3e;
  border-radius: 6px;
  color: #e6e1cf;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.modern-input::placeholder {
  color: #8a8a8a;
}

.modern-input:focus {
  outline: none;
  background: #2d2d2d;
  border-color: #ff2667;
  box-shadow: 0 0 0 3px rgba(255, 38, 103, 0.1);
}

.modern-btn-create {
  padding: 0.75rem 1.5rem;
  background: #ff2667;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.modern-btn-create:hover {
  background: #e01f5a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 38, 103, 0.3);
}

.modern-btn-create:active {
  transform: translateY(0);
}

.modern-btn-create i {
  font-size: 0.875rem;
}

.modern-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #8a8a8a;
}

.modern-modal-footer {
  padding: 1rem 1.5rem;
  background: #252526;
  border-top: 1px solid #3e3e3e;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.modern-btn-secondary {
  padding: 0.625rem 1.25rem;
  background: #3e3e3e;
  border: none;
  border-radius: 6px;
  color: #cccccc;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.modern-btn-secondary:hover {
  background: #4e4e4e;
  color: #ffffff;
}
</style>
