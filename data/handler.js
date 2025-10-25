import { serialize, decodeJid } from '../lib/Serializer.js';
import path from 'path';
import fs from 'fs/promises';
import config from '../config.cjs';
import { smsg } from '../lib/myfunc.cjs';
import { handleAntilink } from './antilink.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Function to get group admins
export const getGroupAdmins = (participants = []) => {
    return participants
        .filter(p => p.admin === 'superadmin' || p.admin === 'admin')
        .map(p => p.id);
};

const Handler = async (chatUpdate, sock, logger) => {
    try {
        if (chatUpdate.type !== 'notify') return;

        const m = serialize(JSON.parse(JSON.stringify(chatUpdate.messages[0])), sock, logger);
        if (!m.message) return;

        // ✅ FIXED groupMetadata call
        let participants = [];
        if (m.isGroup) {
            const groups = await sock.groupFetchAllParticipating();
            const metadata = groups[m.from];
            participants = metadata ? metadata.participants : [];
        }

        const groupAdmins = m.isGroup ? getGroupAdmins(participants) : [];
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmins = m.isGroup ? groupAdmins.includes(botId) : false;
        const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;

        // ✅ Command prefix handling
        const PREFIX = /^[\\/!#.]/;
        const isCOMMAND = PREFIX.test(m.body);
        const prefixMatch = isCOMMAND ? m.body.match(PREFIX) : null;
        const prefix = prefixMatch ? prefixMatch[0] : '/';
        const cmd = m.body.startsWith(prefix)
            ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
            : '';
        const text = m.body.slice(prefix.length + cmd.length).trim();

        // ✅ Better owner & creator check
        const botNumber = await sock.decodeJid(sock.user.id);
        const ownerNumber = config.OWNER_NUMBER + '@s.whatsapp.net';
        const isCreator = [ownerNumber, botNumber].includes(m.sender);

        // ✅ Check public/private mode
        if (!sock.public && !isCreator) return;

        // ✅ Run Antilink
        await handleAntilink(m, sock, logger, isBotAdmins, isAdmins, isCreator);

        // ✅ Load and execute plugins
        const pluginDir = path.resolve(__dirname, '..', 'plugins');

        try {
            const pluginFiles = await fs.readdir(pluginDir);

            for (const file of pluginFiles) {
                if (!file.endsWith('.js')) continue;
                const pluginPath = path.join(pluginDir, file);

                try {
                    const pluginModule = await import(`file://${pluginPath}`);
                    const runPlugin = pluginModule.default;
                    if (typeof runPlugin === 'function') {
                        await runPlugin(m, sock);
                    }
                } catch (err) {
                    console.error(`❌ Failed to load plugin: ${pluginPath}`, err);
                }
            }
        } catch (err) {
            console.error(`❌ Plugin folder not found: ${pluginDir}`, err);
        }

    } catch (err) {
        console.error('❌ Handler Error:', err);
    }
};

export default Handler;
