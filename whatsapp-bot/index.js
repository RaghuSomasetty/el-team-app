import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg_pg from 'pg';
const { Pool } = pkg_pg;
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './sessions' }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

client.on('qr', (qr) => {
    console.log('\n[SCAN ME] Scan this QR code with your WhatsApp to start VoltMind AI:\n');
    qrcodeTerminal.generate(qr, { small: true });
    
    // Save as image for the user to open easily
    const qrPath = path.join(__dirname, 'whatsapp-qr.png');
    QRCode.toFile(qrPath, qr, { scale: 10 }, (err) => {
        if (err) console.error('[QR] Failed to save image:', err);
        else console.log('\n[QR] Image saved! Please open this file to scan:', qrPath);
    });
});

client.on('ready', () => {
    const number = client.info.wid.user;
    console.log(`\n[VOLTMIND] BoltMind AI is now ONLINE!`);
    console.log(`[IDENTITY] Bot number: ${number}`);
    console.log(`[READY] Add +${number} to your group or send the link to it.\n`);
});

client.on('message', async (msg) => {
    try {
        const chat = await msg.getChat();
        
        // AUTO-JOIN GROUP VIA LINK
        if (!chat.isGroup && msg.body.includes('chat.whatsapp.com/')) {
            const code = msg.body.split('chat.whatsapp.com/')[1].split(' ')[0];
            try {
                await client.acceptInvite(code);
                msg.reply('Successfully joined the group! 🤖');
            } catch (err) {
                msg.reply('Failed to join group. Please check the link.');
            }
            return;
        }

        const text = msg.body.toLowerCase();
        
        if (!text.includes('voltmind') && !text.includes('mot-')) return;

        console.log(`[MSG] Incoming from ${msg.from}: ${msg.body}`);

        // AI Interpretation
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are VoltMind AI, an industrial electrical assistant. 
                    You help technicians log motor current readings and query history.
                    
                    Available Motors in DB: tags like MOT-001, MOT-XYZ, etc.
                    
                    Actions you can detect:
                    1. LOG_INSPECTION: Technician reporting currents (R, Y, B phases) for a motor tag.
                    2. QUERY_HISTORY: Someone asking for the latest or historical data of a motor tag.
                    3. CHAT: General technical question or greeting.
                    
                    Return JSON only:
                    {
                      "action": "LOG_INSPECTION" | "QUERY_HISTORY" | "CHAT",
                      "motorTag": "string" | null,
                      "r": number | null,
                      "y": number | null,
                      "b": number | null,
                      "comment": "string" | null,
                      "response": "string" // Your friendly response or answer
                    }`
                },
                { role: "user", content: msg.body }
            ],
            response_format: { type: "json_object" }
        });

        const ai = JSON.parse(completion.choices[0].message.content);
        
        if (ai.action === 'LOG_INSPECTION' && ai.motorTag) {
            // Save to DB
            const motorRes = await pool.query('SELECT name, area, category, "ratedCurrent" FROM "Motor" WHERE tag = $1', [ai.motorTag.toUpperCase()]);
            if (motorRes.rows.length > 0) {
                const motor = motorRes.rows[0];
                const avgCurrent = ((ai.r || 0) + (ai.y || 0) + (ai.b || 0)) / 3;
                const loadingPct = motor.ratedCurrent ? (avgCurrent / motor.ratedCurrent) * 100 : 0;
                
                await pool.query(
                    'INSERT INTO "MotorInspection" ("motorTag", "motorName", "area", "category", "currentR", "currentY", "currentB", "ratedCurrent", "loadingPct", "abnormality", "inspectedBy") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
                    [ai.motorTag.toUpperCase(), motor.name, motor.area, motor.category, ai.r, ai.y, ai.b, motor.ratedCurrent, loadingPct, ai.comment, "WhatsApp Bot"]
                );
                
                msg.reply(`✅ *VoltMind Logged:* Motor ${ai.motorTag} updated successfully. Loading: ${loadingPct.toFixed(1)}%.`);
            } else {
                msg.reply(`❌ Motor Tag *${ai.motorTag}* not found in VoltMind database. please check the tag.`);
            }
        } 
        else if (ai.action === 'QUERY_HISTORY' && ai.motorTag) {
            const histRes = await pool.query('SELECT "currentR", "currentY", "currentB", "inspectedAt", abnormality FROM "MotorInspection" WHERE "motorTag" = $1 ORDER BY "inspectedAt" DESC LIMIT 1', [ai.motorTag.toUpperCase()]);
            if (histRes.rows.length > 0) {
                const last = histRes.rows[0];
                msg.reply(`📊 *Latest for ${ai.motorTag.toUpperCase()}:*\n📅 Date: ${new Date(last.inspectedAt).toLocaleDateString()}\n⚡ R:${last.currentR}A | Y:${last.currentY}A | B:${last.currentB}A\n📝 Note: ${last.abnormality || 'No abnormality'}`);
            } else {
                msg.reply(`ℹ️ No inspection history found for *${ai.motorTag.toUpperCase()}*.`);
            }
        }
        else if (ai.action === 'CHAT') {
            msg.reply(`🤖 ${ai.response}`);
        }

    } catch (err) {
        console.error('[BOT ERROR]', err);
    }
});

client.initialize();
