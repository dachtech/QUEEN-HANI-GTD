import config from '../config.cjs';

const ping = async (m, Matrix) => {
  try {
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix)
      ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
      : '';

    if (cmd !== "ping") return;

    // Start timing
    const start = Date.now();

    // Emojis sets
    const reactionEmojis = ['🔥', '⚡', '🚀', '💨', '🎯', '🎉', '🌟', '💥', '🕐', '🔹'];
    const textEmojis = ['💎', '🏆', '⚡️', '🚀', '🎶', '🌠', '🌀', '🔱', '🛡️', '✨'];

    // Pick random emojis
    let reactionEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
    let textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
    while (textEmoji === reactionEmoji) {
      textEmoji = textEmojis[Math.floor(Math.random() * textEmojis.length)];
    }

    // React first
    await m.React(reactionEmoji);

    // Calculate delay after reaction
    const mid = Date.now();
    await new Promise((res) => setTimeout(res, 100)); // small delay for realism
    const responseTime = mid - start;

    // Mood based on speed
    let mood;
    if (responseTime <= 100) mood = '⚡ Ultra Fast!';
    else if (responseTime <= 300) mood = '🚀 Super Responsive!';
    else if (responseTime <= 600) mood = '💨 Pretty Quick!';
    else mood = '🐢 A bit slow...';

    // Stylish text output
    const text = `
*⚡ 𝐐𝐔𝐄𝐄𝐍 𝐇𝐀𝐍𝐈 𝐆𝐓𝐃 𝐒𝐏𝐄𝐄𝐃 ⚡*
> *Response Time:* ${responseTime}ms ${textEmoji}
> *Status:* ${mood}
──────────────────────
*Bot is alive and kicking!* 💥
`;

    // Send message
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
            newsletterName: "Dach tech",
            serverMessageId: 143
          }
        }
      },
      { quoted: m }
    );
  } catch (err) {
    console.error("Ping command error:", err);
    await Matrix.sendMessage(m.from, {
      text: "⚠️ *Error:* Something went wrong while checking speed."
    });
  }
};

export default ping;
