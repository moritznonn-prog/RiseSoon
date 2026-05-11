const SENDER = { name: 'RiseSoon', email: 'newsletter@risesoon.de' };

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '' };

    const { email, name } = JSON.parse(event.body || '{}');
    if (!email) return { statusCode: 400, headers, body: JSON.stringify({ error: 'email required' }) };

    try {
        const r1 = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_KEY },
            body: JSON.stringify({ email, attributes: { FIRSTNAME: name || '' }, listIds: [2], updateEnabled: true })
        });
        console.log('contacts status:', r1.status, await r1.text());

        const firstName = name ? name.split(' ')[0] : 'dort';
        const r2 = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_KEY },
            body: JSON.stringify({
                sender: SENDER,
                to: [{ email, name: name || '' }],
                subject: 'Willkommen bei RiseSoon 🚀',
                htmlContent: `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Segoe UI',Arial,sans-serif;color:#fff;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#050505"><tr><td align="center" style="padding:32px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="background:#111;border:1px solid #222;border-radius:16px 16px 0 0;padding:28px 32px 20px;">
  <span style="font-size:1.3rem;font-weight:800;color:#fff;letter-spacing:1px;">Rise<span style="color:#00ff88;">Soon</span></span>
  <p style="margin:8px 0 0;color:#444;font-size:0.78rem;">Dein KI-Trading-Dashboard</p>
</td></tr>
<tr><td style="background:#0d0d0d;border-left:1px solid #222;border-right:1px solid #222;padding:28px 32px;">
  <h2 style="margin:0 0 16px;color:#fff;font-size:1.3rem;font-weight:700;">Willkommen, ${firstName}! 👋</h2>
  <p style="margin:0 0 14px;color:#999;font-size:0.92rem;line-height:1.7;">Du bist jetzt Teil der RiseSoon-Community. Ab sofort erhältst du <strong style="color:#ccc;">2× täglich</strong> deinen persönlichen KI-Marktbericht — morgens und abends.</p>
  <p style="margin:0 0 24px;color:#999;font-size:0.92rem;line-height:1.7;">Was dich erwartet:</p>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:8px 0;color:#888;font-size:0.87rem;">&#9989; Top-Mover des Tages (Aktien, Krypto, ETFs)</td></tr>
    <tr><td style="padding:8px 0;color:#888;font-size:0.87rem;">&#9989; KI-Kursanalyse für jede Aktie & Crypto</td></tr>
    <tr><td style="padding:8px 0;color:#888;font-size:0.87rem;">&#9989; Aktive Markt-Trends in Echtzeit</td></tr>
  </table>
</td></tr>
<tr><td style="background:#0d0d0d;border-left:1px solid #222;border-right:1px solid #222;padding:20px 32px;" align="center">
  <a href="https://risesoon.de" style="display:inline-block;background:#00ff88;color:#000;text-decoration:none;padding:13px 36px;border-radius:8px;font-weight:800;font-size:0.92rem;">Dashboard öffnen &rarr;</a>
</td></tr>
<tr><td style="background:#080808;border:1px solid #1a1a1a;border-radius:0 0 16px 16px;padding:18px 32px;" align="center">
  <p style="margin:0;color:#2a2a2a;font-size:0.7rem;">&copy; 2025 RiseSoon &middot; Keine Anlageberatung &middot; Alle Angaben ohne Gew&auml;hr.</p>
</td></tr>
</table></td></tr></table></body></html>`
            })
        });
        console.log('smtp status:', r2.status, await r2.text());

        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'internal error' }) };
    }
};
