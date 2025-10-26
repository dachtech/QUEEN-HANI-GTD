import config from '../config.cjs';

const uptime = async (m, Matrix, startTime) => {
  try {
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix)
      ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
      : '';

    if (cmd !== "uptime") return;

    // === Reaction Emojis ===
    const reactionEmojis = ['🕐', '⚡', '🚀', '🌟', '🔥', '💫', '💎', '✨', '💥', '🔹'];
    const textEmojis = ['💎', '🏆', '⚙️', '🌠', '🛡️', '🚀', '🎯', '🌈', '⚡️', '✨'];

    // Randomly pick emojis
    let reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
    let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
    while (textEmoji === reactionEmoji) {
      textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
    }

    await m.React(reactionEmoji);

    // === Calculate uptime ===
    const now = Date.now();
    const uptimeMs = now - startTime;
    const seconds = Math.floor((uptimeMs / 1000) % 60);
    const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);
    const hours = Math.floor((uptimeMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));

    const uptimeString = [
      days ? `${days}d` : '',
      hours ? `${hours}h` : '',
      minutes ? `${minutes}m` : '',
      `${seconds}s`
    ].filter(Boolean).join(' ');

    // === Mood Indicator ===
    let mood;
    if (days >= 7) mood = '👑 *Legendary Stability!*';
    else if (days >= 1) mood = '⚙️ *Running Strong!*';
    else if (hours >= 6) mood = '💪 *Holding Steady!*';
    else mood = '🌱 *Just Booted!*';

    // === Modern styled message ===
    const text = `
╭───────────────────────────╮
│ ⚡ *Queen Hani GTD Status* ⚡
├───────────────────────────┤
│ 🕐 *Uptime:* ${uptimeString} ${textEmoji}
│ 📶 *Status:* ${mood}
│ 💫 *Since:* ${new Date(startTime).toLocaleString()}
╰───────────────────────────╯
✨ *Bot is online, responsive, and radiant!* ✨
`;

    // === Send Message ===
    await Matrix.sendMessage(
      m.from,
      {
        text,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363401831624774@newsletter',
            newsletterName: "Queen Hani GDT",
            serverMessageId: 144
          }
        }
      },
      { quoted: m }
    );

  } catch (err) {
    console.error("Uptime command error:", err.message, err.stack);
    await Matrix.sendMessage(m.from, {
      text: "⚠️ *Error:* Unable to fetch uptime data."
    });
  }
};

export default uptime;
