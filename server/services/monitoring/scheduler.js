const Monitor = require('../../models/Monitor');
const MonitorChecker = require('./checker');

class MonitorScheduler {
  constructor(io) {
    this.io = io;
    this.checker = new MonitorChecker();
    this.intervals = new Map();
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log('🔄 Monitor scheduler started');

    // Load all monitors and start scheduling
    await this.loadAndSchedule();

    // Check for new/enabled monitors every minute
    setInterval(() => {
      this.loadAndSchedule();
    }, 60000); // Check every minute
  }

  async loadAndSchedule() {
    try {
      const monitors = await Monitor.getAll();
      
      for (const monitor of monitors) {
        // Only schedule if enabled
        if (monitor.enabled === 1 || monitor.enabled === true) {
          const interval = monitor.interval || 60; // Default 60 seconds
          const intervalMs = interval * 1000;

          // Clear existing interval if it exists
          if (this.intervals.has(monitor.id)) {
            clearInterval(this.intervals.get(monitor.id));
          }

          // Schedule new interval
          const intervalId = setInterval(async () => {
            try {
              // Check if monitor is still enabled
              const currentMonitor = await Monitor.getById(monitor.id);
              if (currentMonitor && (currentMonitor.enabled === 1 || currentMonitor.enabled === true)) {
                await this.checkMonitor(currentMonitor);
              } else {
                // Disable monitoring if monitor is disabled
                this.stopMonitor(monitor.id);
              }
            } catch (error) {
              console.error(`Error checking monitor ${monitor.id}:`, error);
            }
          }, intervalMs);

          this.intervals.set(monitor.id, intervalId);
          console.log(`✅ Scheduled monitor ${monitor.id} (${monitor.name}) - interval: ${interval}s`);

          // Run initial check immediately
          this.checkMonitor(monitor);
        } else {
          // Stop monitoring if disabled
          this.stopMonitor(monitor.id);
        }
      }
    } catch (error) {
      console.error('Error loading and scheduling monitors:', error);
    }
  }

  async checkMonitor(monitor) {
    try {
      console.log(`🔍 Checking monitor: ${monitor.name} (${monitor.type})`);
      
      const result = await this.checker.check(monitor);
      
      // Update monitor status
      await Monitor.updateStatus(
        monitor.id,
        result.status,
        result.responseTime,
        result.statusCode,
        result.errorMessage
      );

      // Emit socket event
      if (this.io) {
        this.io.emit('monitor:checked', {
          monitor_id: monitor.id,
          status: result.status,
          response_time: result.responseTime,
          status_code: result.statusCode,
          error_message: result.errorMessage,
          checked_at: new Date().toISOString(),
        });
      }

      // Check if status changed and send notification if needed
      if (monitor.status !== result.status && monitor.notification_enabled) {
        await this.sendNotification(monitor, result);
      }

      console.log(`✅ Monitor ${monitor.name}: ${result.status} (${result.responseTime}ms)`);
    } catch (error) {
      console.error(`Error checking monitor ${monitor.id}:`, error);
    }
  }

  async sendNotification(monitor, result) {
    // This will be implemented in Phase 4
    console.log(`📧 Notification needed for monitor ${monitor.name}: ${result.status}`);
  }

  stopMonitor(monitorId) {
    if (this.intervals.has(monitorId)) {
      clearInterval(this.intervals.get(monitorId));
      this.intervals.delete(monitorId);
      console.log(`⏹️  Stopped monitoring for monitor ${monitorId}`);
    }
  }

  stop() {
    this.isRunning = false;
    for (const [monitorId, intervalId] of this.intervals) {
      clearInterval(intervalId);
    }
    this.intervals.clear();
    console.log('⏹️  Monitor scheduler stopped');
  }

  async checkNow(monitorId) {
    const monitor = await Monitor.getById(monitorId);
    if (monitor) {
      await this.checkMonitor(monitor);
    }
  }
}

module.exports = MonitorScheduler;

