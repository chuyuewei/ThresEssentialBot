// src/utils/anti-spam/messageHistory.js

class MessageHistory {
  constructor() {
    this.history = new Map();
    this.cleanupInterval = null;
  }

  /**
   * 添加消息到历史记录
   */
  addMessage(message) {
    const userId = message.author.id;
    const userHistory = this.history.get(userId) || [];

    userHistory.push({
      content: message.content,
      timestamp: Date.now(),
      channelId: message.channelId,
    });

    // 只保留最近100条消息
    if (userHistory.length > 100) {
      userHistory.shift();
    }

    this.history.set(userId, userHistory);
  }

  /**
   * 获取用户历史记录
   */
  getUserHistory(userId) {
    return this.history.get(userId) || [];
  }

  /**
   * 清理旧消息
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5分钟

    for (const [userId, messages] of this.history.entries()) {
      const validMessages = messages.filter(msg => now - msg.timestamp < maxAge);

      if (validMessages.length === 0) {
        this.history.delete(userId);
      } else {
        this.history.set(userId, validMessages);
      }
    }
  }

  /**
   * 启动自动清理
   */
  startCleanup(interval = 60000) {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, interval);
  }

  /**
   * 停止自动清理
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * 清除用户历史
   */
  clearUser(userId) {
    this.history.delete(userId);
  }

  /**
   * 清除所有历史
   */
  clearAll() {
    this.history.clear();
  }

  /**
   * 获取统计信息
   */
  getStats() {
    let totalMessages = 0;
    let activeUsers = 0;

    for (const [userId, messages] of this.history.entries()) {
      totalMessages += messages.length;
      if (messages.length > 0) {
        activeUsers++;
      }
    }

    return {
      totalMessages,
      activeUsers,
      trackedUsers: this.history.size,
    };
  }
}

// 导出单例
const messageHistory = new MessageHistory();

module.exports = messageHistory;
