/**
 * IP address and subnet utility functions
 */

/**
 * Parse CIDR notation and return network details
 * @param {string} cidr - CIDR notation (e.g., "192.168.1.0/24")
 * @returns {Object} Network details
 */
function parseCIDR(cidr) {
  const [network, prefixLength] = cidr.split('/');
  const cidrNum = parseInt(prefixLength, 10);

  if (isNaN(cidrNum) || cidrNum < 0 || cidrNum > 32) {
    throw new Error('Invalid CIDR notation');
  }

  const networkAddress = network.trim();
  const totalIPs = Math.pow(2, 32 - cidrNum);
  const usableIPs = totalIPs - 2; // Subtract network and broadcast addresses

  return {
    network: networkAddress,
    cidr: cidrNum,
    totalIPs: totalIPs,
    usableIPs: usableIPs,
    subnet: cidr,
  };
}

/**
 * Generate all IP addresses in a subnet
 * @param {string} network - Network address (e.g., "192.168.1.0")
 * @param {number} cidr - CIDR prefix length (e.g., 24)
 * @returns {Array<string>} Array of IP addresses
 */
function generateIPs(network, cidr) {
  const [a, b, c, d] = network.split('.').map(Number);
  const hostBits = 32 - cidr;
  const totalIPs = Math.pow(2, hostBits);

  const ips = [];
  // Generate IPs from 1 to totalIPs-2 (skip network 0 and broadcast totalIPs-1)
  // For /24: totalIPs = 256, so we generate 1-254
  for (let i = 1; i < totalIPs - 1; i++) {
    const ip = calculateIP(a, b, c, d, i);
    ips.push(ip);
  }

  return ips;
}

/**
 * Calculate IP address from base and offset
 * @param {number} a - First octet
 * @param {number} b - Second octet
 * @param {number} c - Third octet
 * @param {number} d - Fourth octet
 * @param {number} offset - Offset from network address
 * @returns {string} IP address
 */
function calculateIP(a, b, c, d, offset) {
  let total = a * 256 * 256 * 256 + b * 256 * 256 + c * 256 + d + offset;
  const octet4 = total % 256;
  total = Math.floor(total / 256);
  const octet3 = total % 256;
  total = Math.floor(total / 256);
  const octet2 = total % 256;
  total = Math.floor(total / 256);
  const octet1 = total;

  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}

/**
 * Validate IP address format
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid
 */
function isValidIP(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

/**
 * Validate CIDR notation
 * @param {string} cidr - CIDR notation to validate
 * @returns {boolean} True if valid
 */
function isValidCIDR(cidr) {
  try {
    parseCIDR(cidr);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  parseCIDR,
  generateIPs,
  isValidIP,
  isValidCIDR,
};

