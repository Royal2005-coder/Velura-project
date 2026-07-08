const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Read .env manually
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const pool = new Pool({ connectionString: env.SUPABASE_DIRECT_URL || (process.env.SUPABASE_DIRECT_URL || process.env.SUPABASE_DB_URL) });

async function processPending() {
  const { rows } = await pool.query(`
    SELECT * FROM email_outbox 
    WHERE status = 'pending' 
    ORDER BY created_at DESC 
    LIMIT 5
  `);

  console.log('Pending emails:', rows.length);
  if (!rows.length) { process.exit(0); return; }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.SMTP_USER || env.SMTP_FROM,
      pass: env.SMTP_PASS
    }
  });

  for (const email of rows) {
    console.log('Sending:', email.to_address, '-', email.subject);
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM || env.SMTP_USER,
        to: email.to_address,
        subject: email.subject,
        text: email.body
      });
      console.log('  -> Sent!');
      await pool.query("UPDATE email_outbox SET status = 'sent', sent_at = NOW() WHERE id = $1", [email.id]);
    } catch (err) {
      console.log('  -> Failed:', err.message);
    }
  }

  await transporter.close();
  process.exit(0);
}

processPending().catch(e => { console.error(e); process.exit(1); });
