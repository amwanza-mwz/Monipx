const Subnet = require('../../models/Subnet');
const SubnetScanner = require('./scanner');

class SubnetScheduler {
  constructor(io) {
    this.io = io;
    this.scanner = new SubnetScanner(io);
    this.intervals = new Map();
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log('🔄 Subnet auto-scan scheduler started');

    // Load all subnets and start scheduling
    await this.loadAndSchedule();

    // Check for new/enabled subnets every minute
    setInterval(() => {
      this.loadAndSchedule();
    }, 60000); // Check every minute
  }

  async loadAndSchedule() {
    try {
      const subnets = await Subnet.getAll();
      
      for (const subnet of subnets) {
        // Only schedule if scan is enabled
        if (subnet.scan_enabled === 1 || subnet.scan_enabled === true) {
          const interval = subnet.scan_interval || 30; // Default 30 seconds
          const intervalMs = interval * 1000;

          // Clear existing interval if it exists
          if (this.intervals.has(subnet.id)) {
            clearInterval(this.intervals.get(subnet.id));
          }

          // Schedule new interval
          const intervalId = setInterval(async () => {
            try {
              // Check if scan is still enabled
              const currentSubnet = await Subnet.getById(subnet.id);
              if (currentSubnet && (currentSubnet.scan_enabled === 1 || currentSubnet.scan_enabled === true)) {
                console.log(`🔄 Auto-scanning subnet ${subnet.id} (${subnet.name})`);
                await this.scanner.scanSubnet(subnet.id, { timeout: 1000, concurrent: 20 });
              } else {
                // Disable scanning if subnet is disabled
                this.stopSubnet(subnet.id);
              }
            } catch (error) {
              console.error(`Error auto-scanning subnet ${subnet.id}:`, error);
            }
          }, intervalMs);

          this.intervals.set(subnet.id, intervalId);
          console.log(`✅ Scheduled auto-scan for subnet ${subnet.id} (${subnet.name}) - interval: ${interval}s`);
        } else {
          // Stop scanning if disabled
          this.stopSubnet(subnet.id);
        }
      }
    } catch (error) {
      console.error('Error loading and scheduling subnets:', error);
    }
  }

  stopSubnet(subnetId) {
    if (this.intervals.has(subnetId)) {
      clearInterval(this.intervals.get(subnetId));
      this.intervals.delete(subnetId);
      console.log(`⏹️  Stopped auto-scan for subnet ${subnetId}`);
    }
  }

  stop() {
    this.isRunning = false;
    for (const [subnetId, intervalId] of this.intervals) {
      clearInterval(intervalId);
    }
    this.intervals.clear();
    console.log('⏹️  Subnet auto-scan scheduler stopped');
  }
}

module.exports = SubnetScheduler;

