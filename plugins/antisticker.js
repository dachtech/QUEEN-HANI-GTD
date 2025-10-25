import config from '../config.cjs';

const antisticker = async (m, Matrix) => {
  try {
    // Only act in group chats
    if (!m.isGroup) return;

    // Check if anti-sticker feature is enabled in config
    if (!config.ANTI_STICKER) return;

    // Check message type
    const messageType = m.mtype || m.type || '';
    if (messageType !== 'stickerMessage') return;

    // Optional: allow specific users (like admins or bot owner)
    const botNumber = Matrix.user?.id?.split(':')[0];
    const isBotAdmin = m.isBotAdmin || false;
    const isSenderAdmin = m.isAdmin || false;

    // If the sender is admin or bot owner, skip
    if (isSenderAdmin) return;

    // Delete the sticker message
    await Matrix.sendMessage(m.from, { delete: m.key });

    // Optionally warn the user
    const warnText = `🚫 *Stickers are not allowed in this group!*`;
    await Matrix.sendMessage(m.from, { text: warnText }, { quoted: m });

    console.log(`Sticker deleted from ${m.sender} in ${m.from}`);

  } catch (err) {
    console.error('AntiSticker error:', err);
  }
};

export default antisticker;
