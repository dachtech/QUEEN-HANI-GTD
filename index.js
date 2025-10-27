import dotenv from 'dotenv';
dotenv.config();

import {
    makeWASocket,
    Browsers,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Handler, Callupdate, GroupUpdate } from './data/index.js';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import NodeCache from 'node-cache';
import path from 'path';
import chalk from 'chalk';
import moment from 'moment-timezone';
import axios from 'axios';
import config from './config.cjs';
import pkg from './lib/autoreact.cjs';
import { File } from 'megajs';

const { emojis, doReact } = pkg;

const sessionName = "session";
const app = express();
const orange = chalk.bold.hex("#FFA500");
const lime = chalk.bold.hex("#32CD32");
let useQR = false;
let initialConnection = true;
const PORT = process.env.PORT || 3000;

const MAIN_LOGGER = pino({
    timestamp: () => `,"time":"${new Date().toJSON()}"`
});
const logger = MAIN_LOGGER.child({});
logger.level = "trace";

const msgRetryCounterCache = new NodeCache();

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

async function downloadSessionData() {
  try {
    const sessionId = config.SESSION_ID;
    if (!sessionId || !sessionId.startsWith("QUEEN-HANI;;;")) {
      console.log(chalk.red("❌ SESSION_ID missing or invalid format."));
      return false;
    }

    const filePart = sessionId.split("QUEEN-HANI;;;")[1];
    if (!filePart || !filePart.includes('#')) {
      console.log(chalk.red("❌ SESSION_ID format must be: QUEEN-HANI;;;fileid#key"));
      return false;
    }

    const [fileId, fileKey] = filePart.split('#');
    const megaFile = File.fromURL(`https://mega.nz/file/${fileId}#${fileKey}`);

    console.log("🔄 Downloading session from MEGA...");
    const fileData = await new Promise((resolve, reject) => {
      megaFile.download((err, data) => (err ? reject(err) : resolve(data)));
    });

    await fs.promises.writeFile(credsPath, fileData);
    console.log(chalk.green("✅ Session restored from MEGA."));
    return true;
  } catch (err) {
    console.error(chalk.red(`❌ Session download error: ${err.message}`));
    return false;
  }
}

async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`popkid using WA v${version.join('.')}, isLatest: ${isLatest}`);

        const Matrix = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: useQR,
            browser: ["demon", "safari", "3.3"],
            auth: state,
            getMessage: async (key) => {
                return { conversation: "" };
            }
        });

        Matrix.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                    console.log(chalk.yellow("⚠ Connection closed, retrying..."));
                    setTimeout(() => start(), 5000);
                }
            } else if (connection === 'open') {
                if (initialConnection) {
                    console.log(chalk.green("Popkid Xtech Connected"));
                    Matrix.sendMessage(Matrix.user.id, { 
                        image: { url: "https://files.catbox.moe/w5xf3f.jpg" }, 
                        caption: `╭─────────────━┈⊷
│ Dach X Tech
╰─────────────━┈⊷

╭─────────────━┈⊷
│ ʙᴏᴛ ᴄᴏɴɴᴇᴄᴛᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ
│ ᴘʟᴇᴀsᴇ ғᴏʟʟᴏᴡ ᴜs ʙᴇʟᴏᴡ
╰─────────────━┈⊷

> *ᴍᴀᴅᴇ ʙʏ Dach King*`
                    });
                    initialConnection = false;
                } else {
                    console.log(chalk.blue("♻ Connection reestablished after restart."));
                }
            }
        });

        Matrix.ev.on('creds.update', saveCreds);
        Matrix.ev.on("messages.upsert", async chatUpdate => await Handler(chatUpdate, Matrix, logger));
        Matrix.ev.on("call", async (json) => await Callupdate(json, Matrix));
        Matrix.ev.on("group-participants.update", async (messag) => await GroupUpdate(Matrix, messag));

        if (config.MODE === "public") {
            Matrix.public = true;
        } else {
            Matrix.public = false;
        }

        Matrix.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek.key.fromMe && config.AUTO_REACT) {
                    if (mek.message) {
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        await doReact(randomEmoji, mek, Matrix);
                    }
                }
            } catch (err) {
                console.error('Error during auto reaction:', err);
            }
        });
    } catch (error) {
        console.error('Critical Error:', error);
        process.exit(1);
    }
}

async function init() {
    if (fs.existsSync(credsPath)) {
        console.log("🔒 Session file found, proceeding without QR code.");
        await start();
    } else {
        const sessionDownloaded = await downloadSessionData();
        if (sessionDownloaded) {
            console.log("🔒 Session downloaded, starting bot.");
            await start();
        } else {
            console.log("No session found or downloaded, QR code will be printed for authentication.");
            useQR = true;
            await start();
        }
    }
}

init();

app.get('/', (req, res) => {
    res.send('am popkid bot');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
