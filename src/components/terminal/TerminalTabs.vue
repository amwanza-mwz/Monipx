<template>
  <div class="terminal-tabs">
    <div class="tabs-header">
      <div class="tabs-list">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-item"
          :class="{ active: tab.id === activeTabId }"
          @click="$emit('select-tab', tab.id)"
        >
          <i class="bi bi-terminal tab-icon"></i>
          <span class="tab-name">{{ tab.session.name }}</span>
          <span class="tab-status" :class="`status-${tab.status}`"></span>
          <button class="tab-close" @click.stop="$emit('close-tab', tab.id)">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="tabs-body">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        v-show="tab.id === activeTabId"
        class="tab-pane"
      >
        <TerminalWindow
          :session="tab.session"
          :tab-id="tab.id"
          @status-change="handleStatusChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import TerminalWindow from './TerminalWindow.vue';

export default {
  name: 'TerminalTabs',
  components: {
    TerminalWindow,
  },
  props: {
    tabs: { type: Array, required: true },
    activeTabId: { type: String, default: null },
  },
  emits: ['select-tab', 'close-tab', 'update-tab-status'],
  setup(props, { emit }) {
    const handleStatusChange = (data) => {
      emit('update-tab-status', data);
    };

    return {
      handleStatusChange,
    };
  },
};
</script>

<style scoped>
.terminal-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0d1117;
}

.tabs-header {
  display: flex;
  align-items: center;
  background: #161b22;
  border-bottom: 1px solid #30363d;
  height: 40px;
  padding: 0 0.5rem;
  flex-shrink: 0;
  gap: 2px;
}

.tabs-list {
  display: flex;
  flex: 1;
  overflow-x: auto;
  height: 100%;
  gap: 2px;
  padding: 4px 0;
}

.tabs-list::-webkit-scrollbar {
  height: 4px;
}

.tabs-list::-webkit-scrollbar-track {
  background: transparent;
}

.tabs-list::-webkit-scrollbar-thumb {
  background: #30363d;
  border-radius: 4px;
}

.tabs-list::-webkit-scrollbar-thumb:hover {
  background: #58a6ff;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 160px;
  max-width: 260px;
  height: 32px;
  position: relative;
}

.tab-item:hover {
  background: rgba(110, 118, 129, 0.1);
  border-color: #30363d;
}

.tab-item.active {
  background: rgba(88, 166, 255, 0.1);
  border-color: #58a6ff;
}

.tab-icon {
  color: #58a6ff;
  font-size: 14px;
  flex-shrink: 0;
}

.tab-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #c9d1d9;
  font-weight: 500;
}

.tab-item.active .tab-name {
  color: #ffffff;
}

.tab-status {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #6e7681;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(110, 118, 129, 0.2);
}

.tab-status.status-connecting {
  background: #d29922;
  box-shadow: 0 0 0 2px rgba(210, 153, 34, 0.2);
  animation: pulse-glow 1.5s ease-in-out infinite;
}

.tab-status.status-connected {
  background: #7ee787;
  box-shadow: 0 0 0 2px rgba(126, 231, 135, 0.2);
}

.tab-status.status-disconnected {
  background: #6e7681;
  box-shadow: 0 0 0 2px rgba(110, 118, 129, 0.2);
}

.tab-status.status-error {
  background: #ff7b72;
  box-shadow: 0 0 0 2px rgba(255, 123, 114, 0.2);
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 0 2px rgba(210, 153, 34, 0.2);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 0 4px rgba(210, 153, 34, 0.3);
  }
}

.tab-close {
  background: transparent;
  border: none;
  color: #6e7681;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
  font-size: 14px;
  opacity: 0;
  flex-shrink: 0;
}

.tab-item:hover .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: rgba(255, 123, 114, 0.15);
  color: #ff7b72;
}

.tabs-body {
  flex: 1;
  overflow: hidden;
  background: #0d1117;
  padding: 0.5rem;
}

.tab-pane {
  height: 100%;
  width: 100%;
}
</style>

