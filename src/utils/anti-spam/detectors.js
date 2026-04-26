// src/utils/anti-spam/detectors.js

/**
 * 检测消息中的链接
 */
function detectLinks(content) {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(discord\.(gg|io|me|li)\/[^\s]+)/gi;
  const matches = content.match(urlRegex);
  return matches || [];
}

/**
 * 检测 Discord 邀请码
 */
function detectInvites(content) {
  const inviteRegex = /(discord\.(gg|io|me|li|com\/invite)\/[a-zA-Z0-9-]+)/gi;
  const matches = content.match(inviteRegex);
  return matches || [];
}

/**
 * 检测刷屏行为
 */
function detectSpam(message, userMessageHistory) {
  const userId = message.author.id;
  const now = Date.now();
  const timeWindow = 10000; // 10秒窗口
  const maxMessages = 5; // 最大消息数

  // 获取用户最近的消息
  const recentMessages = userMessageHistory.get(userId) || [];

  // 过滤掉超过时间窗口的消息
  const validMessages = recentMessages.filter(msg => now - msg.timestamp < timeWindow);

  // 检查是否超过限制
  if (validMessages.length >= maxMessages) {
    return {
      detected: true,
      type: 'spam',
      count: validMessages.length,
      timeWindow: timeWindow / 1000,
    };
  }

  // 检查重复消息
  const messageCount = validMessages.filter(msg => msg.content === message.content).length;
  if (messageCount >= 3) {
    return {
      detected: true,
      type: 'duplicate',
      count: messageCount,
    };
  }

  return { detected: false };
}

/**
 * 检测关键词
 */
function detectKeywords(content, keywords) {
  const detected = [];

  for (const keyword of keywords) {
    if (content.toLowerCase().includes(keyword.toLowerCase())) {
      detected.push(keyword);
    }
  }

  return detected;
}

/**
 * 检测大写字母过多
 */
function detectExcessiveCaps(content) {
  const letters = content.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 5) return { detected: false };

  const caps = letters.replace(/[^A-Z]/g, '');
  const capsRatio = caps.length / letters.length;

  if (capsRatio > 0.7) {
    return {
      detected: true,
      ratio: capsRatio,
    };
  }

  return { detected: false };
}

/**
 * 检测表情符号过多
 */
function detectExcessiveEmojis(content) {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const emojis = content.match(emojiRegex) || [];

  if (emojis.length > 10) {
    return {
      detected: true,
      count: emojis.length,
    };
  }

  return { detected: false };
}

/**
 * 综合检测
 */
function detectSpamAndAds(message, config, userMessageHistory) {
  const content = message.content;
  const detections = [];

  // 检测链接
  if (config.blockLinks) {
    const links = detectLinks(content);
    if (links.length > 0) {
      detections.push({
        type: 'links',
        detected: true,
        items: links,
        action: config.linkAction || 'delete',
      });
    }
  }

  // 检测邀请码
  if (config.blockInvites) {
    const invites = detectInvites(content);
    if (invites.length > 0) {
      detections.push({
        type: 'invites',
        detected: true,
        items: invites,
        action: config.inviteAction || 'delete',
      });
    }
  }

  // 检测刷屏
  if (config.blockSpam) {
    const spam = detectSpam(message, userMessageHistory);
    if (spam.detected) {
      detections.push({
        type: 'spam',
        detected: true,
        ...spam,
        action: config.spamAction || 'mute',
      });
    }
  }

  // 检测关键词
  if (config.blockedKeywords && config.blockedKeywords.length > 0) {
    const keywords = detectKeywords(content, config.blockedKeywords);
    if (keywords.length > 0) {
      detections.push({
        type: 'keywords',
        detected: true,
        items: keywords,
        action: config.keywordAction || 'delete',
      });
    }
  }

  // 检测大写字母
  if (config.blockExcessiveCaps) {
    const caps = detectExcessiveCaps(content);
    if (caps.detected) {
      detections.push({
        type: 'caps',
        detected: true,
        ...caps,
        action: config.capsAction || 'warn',
      });
    }
  }

  // 检测表情符号
  if (config.blockExcessiveEmojis) {
    const emojis = detectExcessiveEmojis(content);
    if (emojis.detected) {
      detections.push({
        type: 'emojis',
        detected: true,
        ...emojis,
        action: config.emojiAction || 'warn',
      });
    }
  }

  return detections;
}

module.exports = {
  detectLinks,
  detectInvites,
  detectSpam,
  detectKeywords,
  detectExcessiveCaps,
  detectExcessiveEmojis,
  detectSpamAndAds,
};
