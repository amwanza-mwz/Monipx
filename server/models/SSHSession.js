const db = require('../database/db');
const KeyEncryption = require('../services/ssh/KeyEncryption');

class SSHSession {
  static async getAll() {
    return await db.prepare('SELECT * FROM ssh_sessions ORDER BY group_name, name').all();
  }

  static async getById(id) {
    try {
      // Ensure ID is a number
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        console.error(`❌ Invalid session ID: ${id}`);
        return null;
      }
      return await db.prepare('SELECT * FROM ssh_sessions WHERE id = ?').get(numericId);
    } catch (error) {
      console.error(`❌ Error fetching session by ID ${id}:`, error);
      return null;
    }
  }

  static async getByGroup(groupName) {
    return await db.prepare('SELECT * FROM ssh_sessions WHERE group_name = ? ORDER BY name').all(groupName);
  }

  static async getAllGroups() {
    const result = await db.prepare(`
      SELECT DISTINCT group_name 
      FROM ssh_sessions 
      WHERE group_name IS NOT NULL 
      ORDER BY group_name
    `).all();
    return result.map(row => row.group_name);
  }

  static async create(data) {
    const {
      name,
      group_name,
      host,
      port,
      username,
      auth_method,
      ssh_key_id,
      password,
      terminal_type,
      color_scheme,
      keep_alive,
      auto_reconnect,
      description,
    } = data;

    console.log('📝 Creating session with keep_alive:', keep_alive, 'type:', typeof keep_alive);
    console.log('📝 Creating session with auto_reconnect:', auto_reconnect, 'type:', typeof auto_reconnect);

    // Encrypt password if provided
    let encryptedPassword = null;
    if (password && auth_method === 'password') {
      console.log('🔐 Encrypting session password...');
      encryptedPassword = KeyEncryption.encrypt(password);
    }

    const stmt = db.prepare(`
      INSERT INTO ssh_sessions (
        name, group_name, host, port, username, auth_method, ssh_key_id, password,
        terminal_type, color_scheme, keep_alive, auto_reconnect, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Handle keep_alive: if boolean true, convert to 30; if number, use it; if false/null, use 0
    let keepAliveValue = 0;
    if (typeof keep_alive === 'boolean') {
      keepAliveValue = keep_alive ? 30 : 0;
    } else if (typeof keep_alive === 'number') {
      keepAliveValue = keep_alive;
    }

    // Handle auto_reconnect: convert boolean to 1/0
    const autoReconnectValue = auto_reconnect !== undefined ? (auto_reconnect ? 1 : 0) : 0;

    console.log('💾 Saving keep_alive as:', keepAliveValue);
    console.log('💾 Saving auto_reconnect as:', autoReconnectValue);

    const result = await stmt.run(
      name,
      group_name?.trim() || null,
      host,
      port || 22,
      username,
      auth_method || 'key',
      ssh_key_id || null,
      encryptedPassword,
      terminal_type || 'xterm-256color',
      color_scheme || 'default',
      keepAliveValue,
      autoReconnectValue,
      description || null
    );

    return await this.getById(result.lastInsertRowid);
  }

  static async update(id, data) {
    const {
      name,
      group_name,
      host,
      port,
      username,
      auth_method,
      ssh_key_id,
      password,
      terminal_type,
      color_scheme,
      keep_alive,
      auto_reconnect,
      description,
    } = data;

    console.log('📝 Updating session with keep_alive:', keep_alive, 'type:', typeof keep_alive);
    console.log('📝 Updating session with auto_reconnect:', auto_reconnect, 'type:', typeof auto_reconnect);

    // Get existing session to preserve password if not changing
    const existingSession = await this.getById(id);
    if (!existingSession) {
      throw new Error('Session not found');
    }

    // Handle password encryption
    let encryptedPassword = existingSession.password; // Preserve existing password by default

    if (auth_method === 'password') {
      // If switching to password auth or updating password
      if (password) {
        console.log('🔐 Encrypting session password...');
        encryptedPassword = KeyEncryption.encrypt(password);
      }
    } else if (auth_method === 'key') {
      // If switching to key auth, clear password
      encryptedPassword = null;
    }

    const stmt = db.prepare(`
      UPDATE ssh_sessions SET
        name = ?,
        group_name = ?,
        host = ?,
        port = ?,
        username = ?,
        auth_method = ?,
        ssh_key_id = ?,
        password = ?,
        terminal_type = ?,
        color_scheme = ?,
        keep_alive = ?,
        auto_reconnect = ?,
        description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    // Handle keep_alive: if boolean true, convert to 30; if number, use it; if false/null, use 0
    let keepAliveValue = 0;
    if (typeof keep_alive === 'boolean') {
      keepAliveValue = keep_alive ? 30 : 0;
    } else if (typeof keep_alive === 'number') {
      keepAliveValue = keep_alive;
    } else if (keep_alive === undefined) {
      // Preserve existing value if not provided
      keepAliveValue = existingSession.keep_alive || 0;
    }

    // Handle auto_reconnect: convert boolean to 1/0
    let autoReconnectValue;
    if (auto_reconnect !== undefined) {
      autoReconnectValue = auto_reconnect ? 1 : 0;
    } else {
      // Preserve existing value if not provided
      autoReconnectValue = existingSession.auto_reconnect || 0;
    }

    console.log('💾 Updating keep_alive to:', keepAliveValue);
    console.log('💾 Updating auto_reconnect to:', autoReconnectValue);

    await stmt.run(
      name,
      group_name?.trim() || null,
      host,
      port || 22,
      username,
      auth_method || 'key',
      ssh_key_id || null,
      encryptedPassword,
      terminal_type || 'xterm-256color',
      color_scheme || 'default',
      keepAliveValue,
      autoReconnectValue,
      description || null,
      id
    );

    return await this.getById(id);
  }

  static async delete(id) {
    const stmt = db.prepare('DELETE FROM ssh_sessions WHERE id = ?');
    return await stmt.run(id);
  }

  static async clone(id) {
    const session = await this.getById(id);
    if (!session) {
      throw new Error('Session not found');
    }

    // Create a copy with " (Copy)" appended to the name
    const clonedData = {
      ...session,
      name: `${session.name} (Copy)`,
    };
    delete clonedData.id;
    delete clonedData.created_at;
    delete clonedData.updated_at;

    return await this.create(clonedData);
  }

  // Get session with decrypted password for SSH connection
  static async getForConnection(id) {
    try {
      console.log(`🔍 getForConnection called with ID: ${id} (type: ${typeof id})`);

      const session = await this.getById(id);
      if (!session) {
        console.error(`❌ Session not found in database for ID: ${id}`);
        return null;
      }

      console.log(`✅ Session found: ${session.name} (auth: ${session.auth_method})`);

      // Decrypt password if it exists
      if (session.password && session.auth_method === 'password') {
        try {
          console.log('🔓 Decrypting session password...');
          session.decrypted_password = KeyEncryption.decrypt(session.password);
          // Remove encrypted password from response for security
          delete session.password;
        } catch (error) {
          console.error('❌ Failed to decrypt password:', error);
          throw new Error('Failed to decrypt session password');
        }
      }

      return session;
    } catch (error) {
      console.error(`❌ Error in getForConnection for ID ${id}:`, error);
      throw error;
    }
  }
}

module.exports = SSHSession;

