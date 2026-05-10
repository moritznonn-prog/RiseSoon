const SENDER = { name: 'RiseSoon', email: 'moritz.nonn@gmail.com' };
const LIST_ID = 2;

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-nl-secret',
        'Content-Type': 'application/json'
    };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '' };

    if (event.headers['x-nl-secret'] !== process.env.NL_SECRET) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'unauthorized' }) };
    }

    const { subject, htmlTemplate } = JSON.parse(event.body || '{}');
    if (!subject || !htmlTemplate) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'subject and htmlTemplate required' }) };
    }

    let contacts = [];
    try {
        const resp = await fetch(`https://api.brevo.com/v3/contacts/lists/${LIST_ID}/contacts?limit=500`, {
            headers: { 'api-key': process.env.BREVO_KEY }
        });
        if (!resp.ok) return { statusCode: 500, headers, body: JSON.stringify({ error: 'failed to fetch contacts' }) };
        const data = await resp.json();
        contacts = (data.contacts || []).filter(c => !c.emailBlacklisted);
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'failed to fetch contacts' }) };
    }

    if (!contacts.length) return { statusCode: 200, headers, body: JSON.stringify({ sent: 0, total: 0 }) };

    let sent = 0;
    for (const contact of contacts) {
        const html = htmlTemplate.replace(/__EMAIL__/g, encodeURIComponent(contact.email));
        try {
            await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_KEY },
                body: JSON.stringify({
                    sender: SENDER,
                    to: [{ email: contact.email, name: contact.attributes?.FIRSTNAME || '' }],
                    subject,
                    htmlContent: html
                })
            });
            sent++;
            await new Promise(r => setTimeout(r, 150));
        } catch (e) {}
    }

    return { statusCode: 200, headers, body: JSON.stringify({ sent, total: contacts.length }) };
};
