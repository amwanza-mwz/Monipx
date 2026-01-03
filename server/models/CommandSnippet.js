const db = require('../database/db');

class CommandSnippet {
  static async getAll() {
    return await db.prepare('SELECT * FROM command_snippets ORDER BY category, name').all();
  }

  static async getById(id) {
    return await db.prepare('SELECT * FROM command_snippets WHERE id = ?').get(id);
  }

  static async getByCategory(category) {
    return await db.prepare(`
      SELECT * FROM command_snippets 
      WHERE category = ? 
      ORDER BY name
    `).all(category);
  }

  static async getAllCategories() {
    const result = await db.prepare(`
      SELECT DISTINCT category 
      FROM command_snippets 
      WHERE category IS NOT NULL 
      ORDER BY category
    `).all();
    return result.map(row => row.category);
  }

  static async create(data) {
    const { name, command, description, category } = data;

    const stmt = db.prepare(`
      INSERT INTO command_snippets (name, command, description, category)
      VALUES (?, ?, ?, ?)
    `);

    const result = await stmt.run(
      name,
      command,
      description || null,
      category || null
    );

    return await this.getById(result.lastInsertRowid);
  }

  static async update(id, data) {
    const { name, command, description, category } = data;

    const stmt = db.prepare(`
      UPDATE command_snippets SET
        name = ?,
        command = ?,
        description = ?,
        category = ?
      WHERE id = ?
    `);

    await stmt.run(name, command, description || null, category || null, id);
    return await this.getById(id);
  }

  static async delete(id) {
    const stmt = db.prepare('DELETE FROM command_snippets WHERE id = ?');
    return await stmt.run(id);
  }

  static async search(searchTerm) {
    const term = `%${searchTerm}%`;
    return await db.prepare(`
      SELECT * FROM command_snippets 
      WHERE name LIKE ? OR command LIKE ? OR description LIKE ?
      ORDER BY name
    `).all(term, term, term);
  }
}

module.exports = CommandSnippet;

