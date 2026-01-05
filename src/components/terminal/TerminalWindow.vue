<template>
  <div class="terminal-window">
    <div class="terminal-header">
      <div class="terminal-info">
        <i class="bi bi-terminal"></i>
        <span>{{ session.name }} ({{ session.username }}@{{ session.host }})</span>
      </div>
      <div class="terminal-status" :class="statusClass">
        {{ status }}
      </div>
    </div>
    <div class="terminal-body" ref="terminalContainer"></div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import terminalSocket from '../../services/terminal-socket';
import 'xterm/css/xterm.css';

export default {
  name: 'TerminalWindow',
  props: {
    session: { type: Object, required: true },
    tabId: { type: String, required: true },
  },
  emits: ['status-change'],
  setup(props, { emit }) {
    const terminalContainer = ref(null);
    const status = ref('connecting');
    let terminal = null;
    let fitAddon = null;
    let sessionId = null;
    let connectionOptions = {};
    let eventHandlersRegistered = false;

    const statusClass = computed(() => ({
      'status-connecting': status.value === 'connecting',
      'status-connected': status.value === 'connected',
      'status-disconnected': status.value === 'disconnected',
      'status-error': status.value === 'error',
    }));

    // Modern dark terminal theme
    const getTerminalTheme = () => {
      return {
        background: '#0a0e14',
        foreground: '#e6e1cf',
        cursor: '#ff2667',
        cursorAccent: '#0a0e14',
        selectionBackground: 'rgba(255, 255, 255, 0.15)',
        selectionForeground: '#ffffff',
        black: '#01060e',
        red: '#ea6c73',
        green: '#91b362',
        yellow: '#f9af4f',
        blue: '#53bdfa',
        magenta: '#fae994',
        cyan: '#90e1c6',
        white: '#c7c7c7',
        brightBlack: '#686868',
        brightRed: '#f07178',
        brightGreen: '#c2d94c',
        brightYellow: '#ffb454',
        brightBlue: '#59c2ff',
        brightMagenta: '#ffee99',
        brightCyan: '#95e6cb',
        brightWhite: '#ffffff',
      };
    };

    // Store event handlers for cleanup
    let dataHandler = null;
    let closeHandler = null;
    let errorHandler = null;

    const setupEventHandlers = () => {
      if (eventHandlersRegistered) return;

      // Create session-specific handlers that filter by sessionId
      dataHandler = (payload) => {
        // Only process data for this specific session
        if (payload.sessionId === sessionId && terminal) {
          terminal.write(payload.data);
        } else if (payload.sessionId !== sessionId) {
          // Log when data is received for a different session (helps debug isolation)
          console.log(`[Terminal ${sessionId}] Ignoring data for session ${payload.sessionId}`);
        }
      };

      closeHandler = (payload) => {
        // Only process close event for this specific session
        if (payload?.sessionId === sessionId) {
          status.value = 'disconnected';
          emit('status-change', { tabId: props.tabId, status: 'disconnected' });
          if (terminal) {
            terminal.writeln('\r\n\x1b[33m✗ Disconnected\x1b[0m');
            terminal.writeln('\x1b[36mPress Enter to reconnect...\x1b[0m');
          }
        }
      };

      errorHandler = (error) => {
        // Errors don't have sessionId, so we handle them for all
        console.log('Terminal error:', error);
        status.value = 'error';
        emit('status-change', { tabId: props.tabId, status: 'error' });
        if (terminal) {
          terminal.writeln('\r\n\x1b[31m✗ Error: ' + error + '\x1b[0m');
        }
      };

      // Register handlers
      terminalSocket.on('data', dataHandler);
      terminalSocket.on('close', closeHandler);
      terminalSocket.on('error', errorHandler);

      eventHandlersRegistered = true;
    };

    const connect = async () => {
      try {
        console.log('🔄 TerminalWindow: Starting connection for session:', props.session.name);
        console.log('🔄 TerminalWindow: Tab ID:', props.tabId);
        console.log('🔄 TerminalWindow: Terminal container:', terminalContainer.value);

        // Generate unique session ID FIRST (before setting up handlers)
        sessionId = props.tabId;

        // Initialize terminal if not already done
        if (!terminal) {
          console.log('🔄 TerminalWindow: Creating new Terminal instance');
          terminal = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: getTerminalTheme(),
          });

          fitAddon = new FitAddon();
          terminal.loadAddon(fitAddon);

          console.log('🔄 TerminalWindow: Opening terminal in container');
          terminal.open(terminalContainer.value);
          fitAddon.fit();

          console.log('✅ TerminalWindow: Terminal initialized successfully');

          // Setup event handlers only once (AFTER sessionId is set)
          setupEventHandlers();
        }

        // DEBUG: Log session details before connecting
        console.log('\n' + '='.repeat(80));
        console.log('🖥️  [TerminalWindow] CONNECTING TO SSH SESSION');
        console.log('='.repeat(80));
        console.log('Props.session:', {
          id: props.session.id,
          name: props.session.name,
          host: props.session.host,
          port: props.session.port,
          username: props.session.username,
        });
        console.log('Props.tabId:', props.tabId);
        console.log('SessionId for filtering:', sessionId);
        console.log('='.repeat(80) + '\n');

        terminal.writeln('\x1b[33mConnecting to ' + props.session.host + '...\x1b[0m');

        // Prepare connection options
        connectionOptions = {
          term: 'xterm-256color',
          rows: terminal.rows,
          cols: terminal.cols,
        };

        console.log('🔄 [TerminalWindow] Calling terminalSocket.connect()');
        console.log('   Tab/Session ID:', sessionId);
        console.log('   SSH Session ID:', props.session.id, '(type:', typeof props.session.id + ')');
        console.log('   Options:', connectionOptions);

        // Connect via Socket.IO
        await terminalSocket.connect(sessionId, props.session.id, connectionOptions);

        console.log('✅ [TerminalWindow] terminalSocket.connect() completed');

        status.value = 'connected';
        emit('status-change', { tabId: props.tabId, status: 'connected' });
        terminal.writeln('\x1b[32m✓ Connected to ' + props.session.host + '\x1b[0m\r\n');

        // Handle user input
        terminal.onData((data) => {
          // If disconnected and user presses Enter, reconnect
          if (status.value === 'disconnected' && data === '\r') {
            terminal.writeln('\r\n\x1b[33mReconnecting...\x1b[0m');
            connect();
            return;
          }

          // Send input to terminal if connected
          if (status.value === 'connected') {
            terminalSocket.sendInput(sessionId, data);
          }
        });

        // Handle terminal resize
        terminal.onResize(({ rows, cols }) => {
          terminalSocket.resize(sessionId, rows, cols);
        });

        // Handle window resize
        const handleResize = () => {
          if (fitAddon && terminal) {
            fitAddon.fit();
          }
        };
        window.addEventListener('resize', handleResize);

        // Store cleanup function
        terminal._cleanup = () => {
          window.removeEventListener('resize', handleResize);
        };

      } catch (error) {
        console.error('❌ Failed to connect:', error);
        status.value = 'error';
        emit('status-change', { tabId: props.tabId, status: 'error' });
        if (terminal) {
          terminal.writeln('\r\n\x1b[31m✗ Connection failed: ' + error.message + '\x1b[0m');
        }
      }
    };

    onMounted(() => {
      console.log('🔄 TerminalWindow: Component mounted');
      console.log('🔄 TerminalWindow: Props:', { session: props.session, tabId: props.tabId });
      console.log('🔄 TerminalWindow: Container ref:', terminalContainer.value);

      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        console.log('🔄 TerminalWindow: Container ref after timeout:', terminalContainer.value);
        connect();
      }, 100);
    });

    onBeforeUnmount(() => {
      // Remove event listeners
      if (dataHandler) {
        terminalSocket.off('data', dataHandler);
      }
      if (closeHandler) {
        terminalSocket.off('close', closeHandler);
      }
      if (errorHandler) {
        terminalSocket.off('error', errorHandler);
      }

      // Disconnect session
      if (sessionId) {
        terminalSocket.disconnect(sessionId);
      }

      // Cleanup terminal
      if (terminal) {
        if (terminal._cleanup) {
          terminal._cleanup();
        }
        terminal.dispose();
      }
    });

    return {
      terminalContainer,
      status,
      statusClass,
    };
  },
};
</script>

<style scoped>
.terminal-window {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
}
.terminal-header {
  padding: 0.75rem 1rem;
  background: #252526;
  border-bottom: 1px solid #3e3e3e;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.terminal-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #cccccc;
  font-size: 0.875rem;
  font-weight: 500;
}
.terminal-info i {
  color: #007acc;
}
.terminal-status {
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-weight: 500;
}
.status-connecting { background: #f9af4f; color: #000; }
.status-connected { background: #91b362; color: #fff; }
.status-disconnected { background: #686868; color: #fff; }
.status-error { background: #ea6c73; color: #fff; }
.terminal-body {
  flex: 1;
  overflow: hidden;
  background: #1e1e1e;
}
</style>
