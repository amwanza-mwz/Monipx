<template>
  <div class="secure-terminal">
    <div class="terminal-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <SessionList
        :selected-session-id="selectedSession?.id"
        @new-session="showSessionForm = true"
        @new-session-with-group="handleNewSessionWithGroup"
        @connect="connectToSession"
        @edit="editSession"
        @select="selectedSession = $event"
        @delete="handleSessionDeleted"
        ref="sessionListRef"
      />
    </div>

    <div class="terminal-main">
      <div class="terminal-toolbar">
        <button class="btn-toolbar" @click="toggleSidebar" title="Toggle Sidebar">
          <i class="bi" :class="sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'"></i>
        </button>
        <div class="toolbar-title">
          <i class="bi bi-terminal"></i>
          <span>Secure Terminal</span>
        </div>
      </div>

      <div class="terminal-content">
        <div v-if="tabs.length === 0" class="empty-terminal">
          <i class="bi bi-terminal"></i>
          <h4>No Active Connections</h4>
          <p>Select a session from the sidebar and double-click to connect</p>
        </div>

        <TerminalTabs
          v-if="tabs.length > 0"
          :tabs="tabs"
          :active-tab-id="activeTabId"
          @select-tab="selectTab"
          @close-tab="closeTab"
          @update-tab-status="updateTabStatus"
        />
      </div>
    </div>

    <SessionForm
      v-if="showSessionForm"
      :session="editingSession"
      :initial-group-name="newSessionGroupName"
      @close="closeSessionForm"
      @saved="handleSessionSaved"
    />
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import axios from 'axios';
import SessionList from '@/components/terminal/SessionList.vue';
import SessionForm from '@/components/terminal/SessionForm.vue';
import TerminalTabs from '@/components/terminal/TerminalTabs.vue';
import TerminalWindow from '@/components/terminal/TerminalWindow.vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default {
  name: 'SecureTerminal',
  components: {
    SessionList,
    SessionForm,
    TerminalTabs,
    TerminalWindow,
  },
  setup() {
    const sidebarCollapsed = ref(false);
    const selectedSession = ref(null);
    const showSessionForm = ref(false);
    const editingSession = ref(null);
    const newSessionGroupName = ref('');
    const tabs = ref([]);
    const activeTabId = ref(null);
    const sessionListRef = ref(null);

    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value;
    };

    const connectToSession = async (session) => {
      // Check if session is already open in a tab
      const existingTab = tabs.value.find(tab => tab.session.id === session.id);

      if (existingTab) {
        // Session already open, just switch to that tab
        activeTabId.value = existingTab.id;
        return;
      }

      // Create new tab for this session
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newTab = {
        id: sessionId,
        session: session,
        status: 'connecting',
      };
      tabs.value.push(newTab);
      activeTabId.value = sessionId;

      // Persist to database
      try {
        await axios.post(`${API_URL}/api/active-terminal-sessions`, {
          tab_id: sessionId,
          ssh_session_id: session.id,
          status: 'connecting',
        });
        console.log('✅ Active terminal session saved to database');
      } catch (error) {
        console.error('❌ Failed to save active terminal session:', error);
      }
    };

    const selectTab = (tabId) => {
      activeTabId.value = tabId;
    };

    const closeTab = async (tabId) => {
      const index = tabs.value.findIndex((tab) => tab.id === tabId);
      if (index > -1) {
        tabs.value.splice(index, 1);
        if (activeTabId.value === tabId && tabs.value.length > 0) {
          activeTabId.value = tabs.value[Math.max(0, index - 1)].id;
        } else if (tabs.value.length === 0) {
          activeTabId.value = null;
        }

        // Remove from database
        try {
          await axios.delete(`${API_URL}/api/active-terminal-sessions/${tabId}`);
          console.log('✅ Active terminal session removed from database');
        } catch (error) {
          console.error('❌ Failed to remove active terminal session:', error);
        }
      }
    };

    const updateTabStatus = async ({ tabId, status }) => {
      const tab = tabs.value.find((t) => t.id === tabId);
      if (tab) {
        tab.status = status;

        // Update status in database
        try {
          await axios.patch(`${API_URL}/api/active-terminal-sessions/${tabId}`, { status });
          console.log(`✅ Terminal session status updated: ${status}`);
        } catch (error) {
          console.error('❌ Failed to update terminal session status:', error);
        }
      }
    };

    const editSession = (session) => {
      editingSession.value = session;
      showSessionForm.value = true;
    };

    const closeSessionForm = () => {
      showSessionForm.value = false;
      editingSession.value = null;
      newSessionGroupName.value = '';
    };

    const handleSessionSaved = async () => {
      const wasEditing = !!editingSession.value;
      const editedSessionId = editingSession.value?.id;

      closeSessionForm();

      if (sessionListRef.value) {
        await sessionListRef.value.loadSessions();
      }

      if (wasEditing && editedSessionId) {
        const sessions = sessionListRef.value?.sessions || [];
        const restoredSession = sessions.find(s => s.id === editedSessionId);
        if (restoredSession) {
          selectedSession.value = restoredSession;
        }
      } else {
        const sessions = sessionListRef.value?.sessions || [];
        if (sessions.length > 0) {
          const newestSession = sessions.reduce((newest, session) => {
            return (!newest || new Date(session.created_at) > new Date(newest.created_at))
              ? session
              : newest;
          }, null);
          if (newestSession) {
            selectedSession.value = newestSession;
          }
        }
      }
    };

    const handleNewSessionWithGroup = (groupName) => {
      newSessionGroupName.value = groupName;
      showSessionForm.value = true;
    };

    const handleSessionDeleted = async (deletedSession) => {
      // Close any tabs associated with the deleted session
      const tabsToClose = tabs.value.filter(tab => tab.session.id === deletedSession.id);
      for (const tab of tabsToClose) {
        await closeTab(tab.id);
      }

      // Clear selection if the deleted session was selected
      if (selectedSession.value?.id === deletedSession.id) {
        selectedSession.value = null;
      }
    };

    // Restore active terminal sessions on page load
    const restoreActiveSessions = async () => {
      try {
        console.log('🔄 Restoring active terminal sessions...');
        const response = await axios.get(`${API_URL}/api/active-terminal-sessions`);
        const activeSessions = response.data;

        if (activeSessions && activeSessions.length > 0) {
          console.log(`✅ Found ${activeSessions.length} active terminal session(s)`);

          // Validate that sessions have required data
          const validSessions = activeSessions.filter(s => s.session && s.session.id);

          if (validSessions.length > 0) {
            tabs.value = validSessions;
            activeTabId.value = validSessions[0].id;
            console.log('✅ Restored terminal tabs:', validSessions.map(s => s.session.name));
          } else {
            console.log('⚠️  No valid sessions to restore');
          }
        } else {
          console.log('ℹ️  No active terminal sessions to restore');
        }
      } catch (error) {
        console.error('❌ Failed to restore active terminal sessions:', error);
        // Don't block the UI if restore fails
      }
    };

    // Load active sessions on mount
    onMounted(() => {
      restoreActiveSessions();
    });

    // Clean up on unmount (optional - only if you want to clear sessions when leaving the page)
    // Uncomment if you want sessions to persist only during the browser session
    // onBeforeUnmount(async () => {
    //   try {
    //     await axios.delete(`${API_URL}/api/active-terminal-sessions`);
    //     console.log('✅ Cleared all active terminal sessions');
    //   } catch (error) {
    //     console.error('❌ Failed to clear active terminal sessions:', error);
    //   }
    // });

    return {
      sidebarCollapsed,
      selectedSession,
      showSessionForm,
      editingSession,
      newSessionGroupName,
      tabs,
      activeTabId,
      sessionListRef,
      toggleSidebar,
      connectToSession,
      selectTab,
      closeTab,
      updateTabStatus,
      editSession,
      closeSessionForm,
      handleSessionSaved,
      handleNewSessionWithGroup,
      handleSessionDeleted,
    };
  },
};
</script>

<style scoped>
.secure-terminal {
  display: flex;
  height: 100vh;
  background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
}

.terminal-sidebar {
  width: 300px;
  background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  transition: width 0.3s ease;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
}

.terminal-sidebar.collapsed {
  width: 0;
}

.terminal-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0d1117;
}

.terminal-toolbar {
  height: 48px;
  background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
}

.btn-toolbar {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #8b949e;
  padding: 6px 10px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-size: 14px;
  cursor: pointer;
}

.btn-toolbar:hover {
  background: rgba(255, 38, 103, 0.15);
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-1px);
}

.toolbar-title {
  font-weight: 600;
  font-size: 16px;
  color: #c9d1d9;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-title i {
  color: var(--primary);
  font-size: 18px;
}

.terminal-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: #0d1117;
}

.terminal-tab-content {
  height: 100%;
}

.empty-terminal {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8b949e;
  background: #0d1117;
}

.empty-terminal i {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  opacity: 0.3;
  color: var(--primary);
}

.empty-terminal h4 {
  margin-bottom: 0.75rem;
  color: #c9d1d9;
  font-size: 1.5rem;
  font-weight: 600;
}

.empty-terminal p {
  margin: 0;
  font-size: 1rem;
  color: #8b949e;
}
</style>
