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

    // Modern dark terminal theme with improved selection visibility
    const getTerminalTheme = () => {
      return {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        cursorAccent: '#0d1117',
        // Use transparent selection so text remains visible
        selectionBackground: 'rgba(255, 255, 255, 0.25)',
        black: '#0d1117',
        red: '#ff7b72',
        green: '#7ee787',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#b1bac4',
        brightBlack: '#6e7681',
        brightRed: '#ffa198',
        brightGreen: '#9be9a8',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#ffffff',
      };
    };

    // Store event handlers for cleanup
    let dataHandler = null;
    let closeHandler = null;
    let errorHandler = null;
    let terminalInputHandler = null;
    let terminalResizeHandler = null;
    let inputHandlerRegistered = false;

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

        // Handle user input - only register once to prevent duplicate commands
        if (!inputHandlerRegistered) {
          // Dispose previous handlers if they exist
          if (terminalInputHandler) {
            terminalInputHandler.dispose();
          }
          if (terminalResizeHandler) {
            terminalResizeHandler.dispose();
          }

          terminalInputHandler = terminal.onData((data) => {
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
          terminalResizeHandler = terminal.onResize(({ rows, cols }) => {
            terminalSocket.resize(sessionId, rows, cols);
          });

          inputHandlerRegistered = true;
        }

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

      // Dispose terminal input/resize handlers
      if (terminalInputHandler) {
        terminalInputHandler.dispose();
      }
      if (terminalResizeHandler) {
        terminalResizeHandler.dispose();
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
  background: #0d1117;
  border-radius: 8px;
  overflow: hidden;
}

.terminal-header {
  padding: 0.625rem 1rem;
  background: linear-gradient(180deg, #161b22 0%, #0d1117 100%);
  border-bottom: 1px solid #30363d;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 44px;
}

.terminal-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: #c9d1d9;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.terminal-info i {
  color: #58a6ff;
  font-size: 1rem;
}

.terminal-status {
  font-size: 0.6875rem;
  padding: 0.25rem 0.625rem;
  border-radius: 20px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.terminal-status::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-connecting {
  background: rgba(210, 153, 34, 0.15);
  color: #d29922;
  border: 1px solid rgba(210, 153, 34, 0.3);
}

.status-connecting::before {
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.status-connected {
  background: rgba(126, 231, 135, 0.15);
  color: #7ee787;
  border: 1px solid rgba(126, 231, 135, 0.3);
}

.status-disconnected {
  background: rgba(110, 118, 129, 0.15);
  color: #8b949e;
  border: 1px solid rgba(110, 118, 129, 0.3);
}

.status-error {
  background: rgba(255, 123, 114, 0.15);
  color: #ff7b72;
  border: 1px solid rgba(255, 123, 114, 0.3);
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.terminal-body {
  flex: 1;
  overflow: hidden;
  background: #0d1117;
  padding: 4px;
}

.terminal-body :deep(.xterm) {
  height: 100%;
}

/* xterm.js overrides for modern look */
:deep(.xterm) {
  padding: 0.25rem;
}

:deep(.xterm-viewport) {
  overflow-y: auto !important;
}

:deep(.xterm-viewport::-webkit-scrollbar) {
  width: 8px;
}

:deep(.xterm-viewport::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.xterm-viewport::-webkit-scrollbar-thumb) {
  background: #30363d;
  border-radius: 4px;
}

:deep(.xterm-viewport::-webkit-scrollbar-thumb:hover) {
  background: #484f58;
}
</style>
