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
        const resp = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_KEY },
            body: JSON.stringify({ email, attributes: { FIRSTNAME: name || '' }, listIds: [2], updateEnabled: true })
        });
        return { statusCode: resp.ok ? 200 : 500, headers, body: JSON.stringify({ ok: resp.ok }) };
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'internal error' }) };
    }
};
