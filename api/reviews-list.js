const { getSupabase } = require('../lib/supabase');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({
        error: 'Method not allowed'
      });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('reviews')
      .select('id, guest_name, guest_email, rating, stay_type, review, featured, hidden, created_at')
      .eq('hidden', false)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(500).json({
        error: error.message || 'Failed to load reviews'
      });
    }

    return res.status(200).json({
      reviews: Array.isArray(data) ? data : []
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Failed to load reviews'
    });
  }
};
