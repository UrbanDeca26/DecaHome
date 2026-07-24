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

function sanitizeName(name, fallback = 'media') {
  return String(name || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || fallback;
}

function extFromType(type, fallback = 'bin') {
  const t = String(type || '').toLowerCase();
  if (t.includes('png')) return 'png';
  if (t.includes('jpeg') || t.includes('jpg')) return 'jpg';
  if (t.includes('gif')) return 'gif';
  if (t.includes('webp')) return 'webp';
  if (t.includes('mp4')) return 'mp4';
  if (t.includes('mov')) return 'mov';
  if (t.includes('quicktime')) return 'mov';
  if (t.includes('webm')) return 'webm';
  return fallback;
}

async function ensureBucket(supabase) {
  try {
    await supabase.storage.createBucket(BUCKET, { public: true });
  } catch (_) {
    // Bucket already exists or creation is not needed.
  }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (!body || typeof body !== 'object') body = await readBody(req);

    const filename = sanitizeName(body.filename || body.name || 'media');
    const contentType = String(body.contentType || body.mimeType || 'application/octet-stream').trim();
    const folder = sanitizeName(body.folder || 'gallery', 'gallery');

    const supabase = getSupabase();
    await ensureBucket(supabase);

    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${filename}.${extFromType(contentType)}`;

    const signed = await supabase.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
    if (signed.error) {
      return res.status(500).json({ error: signed.error.message || 'Could not create upload URL' });
    }

    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path)?.data?.publicUrl || '';
    const data = signed.data || {};

    return res.status(200).json({
      bucket: BUCKET,
      path,
      publicUrl,
      signedUrl: data.signedUrl || data.signedURL || data.url || '',
      token: data.token || '',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to prepare media upload' });
  }
};
