// Centripetal retrieve door.
//
// This handler brands the door and holds the platform apikey server-side.
// It contains NO access logic: no caching, no transformation, no auth checks.
// The database function on the other side is the perimeter — it decides what
// an access key may see. This file only forwards.

const UPSTREAM = 'https://iofslupbvedjzmfmkdvx.supabase.co/rest/v1/rpc/fn_cent_get';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function parseBody(req) {
  const body = req.body;
  if (body == null) return {};
  if (typeof body === 'string') {
    if (body.trim() === '') return {};
    return JSON.parse(body);
  }
  if (Buffer.isBuffer(body)) {
    const text = body.toString('utf8');
    if (text.trim() === '') return {};
    return JSON.parse(text);
  }
  return body;
}

module.exports = async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  let payload;
  try {
    payload = parseBody(req);
  } catch (e) {
    res.status(400).json({ error: 'invalid_json' });
    return;
  }

  const { key, entity, measure, period } = payload || {};

  const missing = ['key', 'entity', 'measure'].filter((f) => {
    const v = payload ? payload[f] : undefined;
    return v === undefined || v === null || v === '';
  });
  if (missing.length > 0) {
    res.status(400).json({ error: 'missing_required_field', missing });
    return;
  }

  const apikey = process.env.CUBE_ANON_KEY;
  if (!apikey) {
    res.status(500).json({ error: 'door_not_configured' });
    return;
  }

  let upstream;
  try {
    upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        apikey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_key: key,
        p_entity: entity,
        p_measure: measure,
        p_period: period ?? null,
      }),
    });
  } catch (e) {
    res.status(502).json({ error: 'upstream_unreachable' });
    return;
  }

  const text = await upstream.text();
  res.status(upstream.status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(text);
};
