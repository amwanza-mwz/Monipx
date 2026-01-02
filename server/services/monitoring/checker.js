const ping = require('ping');
const http = require('http');
const https = require('https');
const net = require('net');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class MonitorChecker {
  constructor() {
    this.userAgent = 'Monipx-Monitor/1.0';
  }

  /**
   * Check HTTP/HTTPS endpoint
   */
  async checkHttp(monitor) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const url = new URL(monitor.target);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: monitor.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'GET',
        timeout: monitor.timeout || 5000,
        headers: {
          'User-Agent': this.userAgent,
        },
        // Allow self-signed certificates for HTTPS
        rejectUnauthorized: false,
      };

      const req = client.request(options, (res) => {
        const responseTime = Date.now() - startTime;
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          const expectedCode = monitor.expected_status_code || 200;
          const statusOk = res.statusCode === expectedCode;
          const keywordOk = monitor.expected_keyword ? body.includes(monitor.expected_keyword) : true;

          resolve({
            status: statusOk && keywordOk ? 'up' : 'down',
            responseTime,
            statusCode: res.statusCode,
            errorMessage: !statusOk ? `Expected ${expectedCode}, got ${res.statusCode}` :
                         !keywordOk ? 'Keyword not found' : null,
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          status: 'down',
          responseTime: Date.now() - startTime,
          statusCode: null,
          errorMessage: error.message,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 'down',
          responseTime: monitor.timeout,
          statusCode: null,
          errorMessage: 'Request timeout',
        });
      });

      req.end();
    });
  }

  /**
   * Check Ping (ICMP)
   */
  async checkPing(monitor) {
    const startTime = Date.now();

    try {
      const result = await ping.promise.probe(monitor.target, {
        timeout: (monitor.timeout || 5000) / 1000,
        min_reply: 1,
      });

      const responseTime = Date.now() - startTime;

      return {
        status: result.alive ? 'up' : 'down',
        responseTime: result.alive ? parseFloat(result.time) : responseTime,
        statusCode: null,
        errorMessage: result.alive ? null : 'Host unreachable',
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        statusCode: null,
        errorMessage: error.message,
      };
    }
  }

  /**
   * Check TCP Port
   */
  async checkTcp(monitor) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const socket = new net.Socket();
      const timeout = monitor.timeout || 5000;

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        const responseTime = Date.now() - startTime;
        socket.destroy();
        resolve({
          status: 'up',
          responseTime,
          statusCode: null,
          errorMessage: null,
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          status: 'down',
          responseTime: timeout,
          statusCode: null,
          errorMessage: 'Connection timeout',
        });
      });

      socket.on('error', (error) => {
        resolve({
          status: 'down',
          responseTime: Date.now() - startTime,
          statusCode: null,
          errorMessage: error.message,
        });
      });

      socket.connect(monitor.port, monitor.target);
    });
  }

  /**
   * Check Docker Container
   */
  async checkDocker(monitor) {
    const startTime = Date.now();

    try {
      const containerName = monitor.docker_container_name || monitor.target;
      const dockerHost = monitor.docker_host || '';

      // Build docker command
      let cmd = `docker inspect --format='{{.State.Running}}' ${containerName}`;
      if (dockerHost) {
        cmd = `DOCKER_HOST=${dockerHost} ${cmd}`;
      }

      const { stdout, stderr } = await execAsync(cmd);
      const responseTime = Date.now() - startTime;
      const isRunning = stdout.trim() === 'true';

      return {
        status: isRunning ? 'up' : 'down',
        responseTime,
        statusCode: null,
        errorMessage: isRunning ? null : stderr || 'Container not running',
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        statusCode: null,
        errorMessage: error.message,
      };
    }
  }

  /**
   * Check Database Connection
   */
  async checkDatabase(monitor) {
    const startTime = Date.now();

    try {
      const dbType = monitor.database_type?.toLowerCase();

      switch (dbType) {
        case 'mysql':
        case 'mariadb':
          return await this.checkMySQL(monitor, startTime);
        case 'postgresql':
        case 'postgres':
          return await this.checkPostgreSQL(monitor, startTime);
        case 'mongodb':
          return await this.checkMongoDB(monitor, startTime);
        case 'redis':
          return await this.checkRedis(monitor, startTime);
        default:
          return {
            status: 'down',
            responseTime: Date.now() - startTime,
            statusCode: null,
            errorMessage: `Unsupported database type: ${dbType}`,
          };
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        statusCode: null,
        errorMessage: error.message,
      };
    }
  }

  async checkMySQL(monitor, startTime) {
    try {
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: monitor.target,
        port: monitor.port || 3306,
        user: monitor.database_username,
        password: monitor.database_password,
        database: monitor.database_name,
        connectTimeout: monitor.timeout || 5000,
      });

      await connection.ping();
      await connection.end();

      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        statusCode: null,
        errorMessage: null,
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        statusCode: null,
        errorMessage: error.message,
      };
    }
  }

  async checkPostgreSQL(monitor, startTime) {
    try {
      const { Client } = require('pg');
      const client = new Client({
        host: monitor.target,
        port: monitor.port || 5432,
        user: monitor.database_username,
        password: monitor.database_password,
        database: monitor.database_name,
        connectionTimeoutMillis: monitor.timeout || 5000,
      });

      await client.connect();
      await client.query('SELECT 1');
      await client.end();

      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        statusCode: null,
        errorMessage: null,
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        statusCode: null,
        errorMessage: error.message,
      };
    }
  }

  async checkMongoDB(monitor, startTime) {
    try {
      const { MongoClient } = require('mongodb');
      const uri = `mongodb://${monitor.database_username}:${monitor.database_password}@${monitor.target}:${monitor.port || 27017}/${monitor.database_name}`;

      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: monitor.timeout || 5000,
      });

      await client.connect();
      await client.db().admin().ping();
      await client.close();

      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        statusCode: null,
        errorMessage: null,
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        statusCode: null,
        errorMessage: error.message,
      };
    }
  }

  async checkRedis(monitor, startTime) {
    try {
      const redis = require('redis');
      const client = redis.createClient({
        socket: {
          host: monitor.target,
          port: monitor.port || 6379,
          connectTimeout: monitor.timeout || 5000,
        },
        password: monitor.database_password,
      });

      await client.connect();
      await client.ping();
      await client.quit();

      return {
        status: 'up',
        responseTime: Date.now() - startTime,
        statusCode: null,
        errorMessage: null,
      };
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        statusCode: null,
        errorMessage: error.message,
      };
    }
  }

  /**
   * Main check method - routes to appropriate checker
   */
  async check(monitor) {
    try {
      switch (monitor.type.toLowerCase()) {
        case 'http':
        case 'https':
          return await this.checkHttp(monitor);
        case 'ping':
          return await this.checkPing(monitor);
        case 'tcp':
          return await this.checkTcp(monitor);
        case 'docker':
          return await this.checkDocker(monitor);
        case 'database':
          return await this.checkDatabase(monitor);
        default:
          return {
            status: 'down',
            responseTime: 0,
            statusCode: null,
            errorMessage: `Unknown monitor type: ${monitor.type}`,
          };
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: 0,
        statusCode: null,
        errorMessage: error.message,
      };
    }
  }
}

module.exports = MonitorChecker;
