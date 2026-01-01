const ping = require('ping');
const IPAddress = require('../../models/IPAddress');
const Subnet = require('../../models/Subnet');
const { generateIPs, parseCIDR } = require('../../utils/ip-utils');

class SubnetScanner {
  constructor(io) {
    this.io = io;
    this.scanning = new Set();
  }

  async scanSubnet(subnetId, options = {}) {
    const { timeout = 1000, concurrent = 10 } = options;

    if (this.scanning.has(subnetId)) {
      throw new Error('Subnet scan already in progress');
    }

    this.scanning.add(subnetId);
    const subnet = await Subnet.getById(subnetId);
    if (!subnet) {
      this.scanning.delete(subnetId);
      throw new Error('Subnet not found');
    }

    try {
      // Emit scan started
      if (this.io) {
        this.io.emit('subnet:scan:start', { subnet_id: subnetId });
      }

      const networkInfo = parseCIDR(subnet.subnet);
      const ips = generateIPs(networkInfo.network, networkInfo.cidr);
      const totalIPs = ips.length;
      let scanned = 0;
      let connected = 0;
      let disconnected = 0;

      // Process IPs in batches
      for (let i = 0; i < ips.length; i += concurrent) {
        const batch = ips.slice(i, i + concurrent);
        
        const promises = batch.map(async (ip) => {
          try {
            const result = await ping.promise.probe(ip, {
              timeout: timeout / 1000, // ping expects seconds
              min_reply: 1,
            });

            const status = result.alive ? 'connected' : 'disconnected';
            
            // Update or create IP status
            await IPAddress.updateStatusByIP(subnetId, ip, status);

            if (status === 'connected') {
              connected++;
            } else {
              disconnected++;
            }

            scanned++;

            // Emit progress
            if (this.io) {
              this.io.to(`subnet:${subnetId}`).emit('subnet:scan:progress', {
                subnet_id: subnetId,
                scanned,
                total: totalIPs,
                connected,
                disconnected,
                progress: Math.round((scanned / totalIPs) * 100),
              });
            }

            return { ip, status, alive: result.alive };
          } catch (error) {
            scanned++;
            disconnected++;
            
            // Update IP as disconnected on error
            await IPAddress.updateStatusByIP(subnetId, ip, 'disconnected');

            return { ip, status: 'disconnected', alive: false, error: error.message };
          }
        });

        await Promise.all(promises);
      }

      // Update last scan timestamp
      await Subnet.updateLastScan(subnetId);

      // Emit scan complete
      if (this.io) {
        this.io.emit('subnet:scan:complete', {
          subnet_id: subnetId,
          scanned,
          connected,
          disconnected,
        });
      }

      return {
        subnet_id: subnetId,
        total: totalIPs,
        scanned,
        connected,
        disconnected,
      };
    } catch (error) {
      if (this.io) {
        this.io.emit('subnet:scan:error', {
          subnet_id: subnetId,
          error: error.message,
        });
      }
      throw error;
    } finally {
      this.scanning.delete(subnetId);
    }
  }

  isScanning(subnetId) {
    return this.scanning.has(subnetId);
  }
}

module.exports = SubnetScanner;

