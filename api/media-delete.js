const { getSupabase } = require('../lib/supabase');

const BUCKET = 'luxury-stay-media';

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (_) { resolve({}); }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (!body || typeof body !== 'object') body = await readBody(req);
    const path = String(body.path || body.storagePath || '').trim();
    if (!path) {
      return res.status(400).json({ error: 'Missing media path' });
    }

    const supabase = getSupabase();
    const result = await supabase.storage.from(BUCKET).remove([path]);
    if (result.error) {
      return res.status(500).json({ error: result.error.message || 'Failed to delete media' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to delete media' });
  }
};
