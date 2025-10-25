import moment from 'moment-timezone';
import fs from 'fs';
import os from 'os';
import pkg from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;
import config from '../config.cjs';
import axios from 'axios';

// ─── System Info ───────────────────────────────
const totalMemoryBytes = os.totalmem();
const freeMemoryBytes = os.freemem();

function formatBytes(bytes) {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + ' MB';
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(2) + ' KB';
  return bytes.toFixed(2) + ' B';
}

// ─── Uptime ───────────────────────────────
const uptime = process.uptime();
const day = Math.floor(uptime / 86400);
const hours = Math.floor((uptime % 86400) / 3600);
const minutes = Math.floor((uptime % 3600) / 60);
const seconds = Math.floor(uptime % 60);

// ─── Greeting ───────────────────────────────
const timeNow = moment().tz("Asia/Colombo").format("HH:mm:ss");
const dateNow = moment().tz("Asia/Colombo").format("DD/MM/YYYY");
let wish = "";

if (timeNow < "05:00:00") wish = "🌄 Good Morning";
else if (timeNow < "11:00:00") wish = "☀️ Good Morning";
else if (timeNow < "15:00:00") wish = "🌤️ Good Afternoon";
else if (timeNow < "18:00:00") wish = "🌇 Good Evening";
else wish = "🌙 Good Night";

// ─── Menu Command ───────────────────────────────
const menu = async (m, Matrix) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix)
    ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
    : '';
  const mode = config.MODE === 'public' ? '🌍 Public' : '🔒 Private';
  const validCommands = ['menu', 'fullmenu', 'listcmd'];

  if (validCommands.includes(cmd)) {
    const str = `
╭───────────────╮
│ *${config.BOT_NAME.toUpperCase()} v3.1.0* │
╰───────────────╯
👑 Owner: ${config.OWNER_NAME}
🙋‍♂️ User: ${m.pushName}
⚙️ Mode: ${mode}
💻 Platform: ${os.platform()}
💙 Prefix: ${prefix}
📅 ${dateNow} | 🕐 ${timeNow}
─────────────────────
${wish}, ${m.pushName}!
🕒 Uptime: ${day}d ${hours}h ${minutes}m ${seconds}s
💾 RAM: ${formatBytes(totalMemoryBytes - freeMemoryBytes)} / ${formatBytes(totalMemoryBytes)}
─────────────────────

╭─「 📥 DOWNLOAD 」─╮
│ apk
│ facebook
│ mediafire
│ pinterestdl
│ gitclone
│ gdrive
│ insta
│ ytmp3
│ ytmp4
│ play
│ song
│ video
│ tiktok
╰───────────────────╯

╭─「 🧭 CONVERTER 」─╮
│ attp
│ attp2
│ attp3
│ ebinary
│ dbinary
│ emojimix
│ mp3
╰────────────────────╯

╭─「 🤖 AI 」─╮
│ ai
│ dalle
│ remini
│ gemini
│ gpt
│ bug
│ report
╰────────────╯

╭─「 🧰 TOOLS 」─╮
│ calculator
│ tempmail
│ checkmail
│ trt
│ tts
╰─────────────╯

╭─「 👥 GROUP 」─╮
│ linkgroup
│ setppgc
│ setname
│ setdesc
│ group
│ welcome
│ add
│ kick
│ tagall
│ antilink
│ promote
│ demote
│ getbio
╰───────────────╯

╭─「 🔍 SEARCH 」─╮
│ play
│ yts
│ imdb
│ google
│ gimage
│ pinterest
│ wallpaper
│ lyrics
╰────────────────╯

╭─「 🏠 MAIN 」─╮
│ ping
│ alive
│ owner
│ menu
│ infobot
╰───────────────╯

╭─「 👑 OWNER 」─╮
│ join
│ leave
│ block
│ unblock
│ setppbot
│ anticall
│ setstatus
│ autotyping
│ alwaysonline
│ autoread
│ autosview
╰──────────────╯

╭─「 🕵️ STALK 」─╮
│ truecaller
│ instastalk
│ githubstalk
╰────────────────╯

─────────────────────
💬 *${config.DESCRIPTION}*
─────────────────────
Made with ❤️ by *DACH × TECH*
─────────────────────
`;

    // ─── Custom Menu Image ───────────────────────────────
    const imageUrl = 'https://files.catbox.moe/dgunsg.jpg';
    let menuImage;

    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      menuImage = Buffer.from(response.data, 'binary');
    } catch {
      console.error('❌ Failed to fetch menu image. Using fallback.');
      menuImage = fs.readFileSync('./media/popkid.jpg');
    }

    // ─── Send Messages ───────────────────────────────
    await Matrix.sendMessage(
      m.from,
      {
        image: menuImage,
        caption: str,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363290715861418@newsletter',
            newsletterName: "QUEEN HANI GTD",
            serverMessageId: 143,
          },
        },
      },
      { quoted: m }
    );

    await Matrix.sendMessage(
      m.from,
      {
        audio: { url: 'https://files.catbox.moe/5df4ei.m4v' },
        mimetype: 'audio/mp4',
        ptt: true,
      },
      { quoted: m }
    );
  }
};

export default menu;
