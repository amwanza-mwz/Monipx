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
  background: #1e1e1e;
}

.tabs-header {
  display: flex;
  align-items: center;
  background: #252526;
  border-bottom: 1px solid #3e3e3e;
  height: 42px;
  padding: 0;
  flex-shrink: 0;
}

.tabs-list {
  display: flex;
  flex: 1;
  overflow-x: auto;
  height: 100%;
}

.tabs-list::-webkit-scrollbar {
  height: 3px;
}

.tabs-list::-webkit-scrollbar-thumb {
  background: #3e3e3e;
  border-radius: 3px;
}

.tabs-list::-webkit-scrollbar-thumb:hover {
  background: #007acc;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  background: #1e1e1e;
  border-right: 1px solid #3e3e3e;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 180px;
  max-width: 280px;
  height: 100%;
  position: relative;
}

.tab-item:hover {
  background: #2d2d2d;
}

.tab-item.active {
  background: #252526;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #007acc;
}

.tab-icon {
  color: #007acc;
  font-size: 15px;
}

.tab-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #cccccc;
  font-weight: 500;
}

.tab-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #686868;
}

.tab-status.status-connecting {
  background: #f9af4f;
  animation: pulse 1.5s infinite;
}

.tab-status.status-connected {
  background: #91b362;
}

.tab-status.status-disconnected {
  background: #686868;
}

.tab-status.status-error {
  background: #ea6c73;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.tab-close {
  background: transparent;
  border: none;
  color: #858585;
  padding: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.2s;
  font-size: 16px;
  opacity: 0;
}

.tab-item:hover .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: #3e3e3e;
  color: #cccccc;
}

.tabs-body {
  flex: 1;
  overflow: hidden;
  background: #1e1e1e;
}

.tab-pane {
  height: 100%;
  width: 100%;
}
</style>

