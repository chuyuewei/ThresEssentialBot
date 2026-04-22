// src/utils/warnManager.js
const fs = require('fs');
const path = require('path');

const WARNINGS_FILE = path.join(__dirname, '../../data/warnings.json');

class WarnManager {
  static _read() {
    try {
      if (!fs.existsSync(WARNINGS_FILE)) {
        fs.writeFileSync(WARNINGS_FILE, JSON.stringify({}, null, 2));
      }
      const data = fs.readFileSync(WARNINGS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  static _write(data) {
    fs.writeFileSync(WARNINGS_FILE, JSON.stringify(data, null, 2));
  }

  /**
   * 添加警告
   * @returns {object} { warnings: Array, count: Number }
   */
  static addWarning(guildId, userId, reason, moderatorId) {
    const data = this._read();
    const key = `${guildId}-${userId}`;

    if (!data[key]) {
      data[key] = [];
    }

    const warning = {
      id: data[key].length + 1,
      reason,
      moderatorId,
      timestamp: new Date().toISOString(),
    };

    data[key].push(warning);
    this._write(data);

    return { warnings: data[key], count: data[key].length };
  }

  /**
   * 获取用户的所有警告
   */
  static getWarnings(guildId, userId) {
    const data = this._read();
    const key = `${guildId}-${userId}`;
    return data[key] || [];
  }

  /**
   * 清除用户的所有警告
   */
  static clearWarnings(guildId, userId) {
    const data = this._read();
    const key = `${guildId}-${userId}`;
    const count = data[key]?.length || 0;
    delete data[key];
    this._write(data);
    return count;
  }

  /**
   * 移除指定ID的警告
   */
  static removeWarning(guildId, userId, warnId) {
    const data = this._read();
    const key = `${guildId}-${userId}`;

    if (!data[key]) return false;

    const index = data[key].findIndex((w) => w.id === warnId);
    if (index === -1) return false;

    data[key].splice(index, 1);

    // 重新编号
    data[key].forEach((w, i) => (w.id = i + 1));

    this._write(data);
    return true;
  }
}

module.exports = WarnManager;