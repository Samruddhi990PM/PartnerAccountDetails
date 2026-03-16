const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      officialEmail,
      phoneName,
      phoneNumber,
      remarks,
      ourWA     = [],
      yourWA    = [],
      platforms = [],
      notifEmail
    } = req.body;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { error } = await supabase
      .from('onboarding_submissions')
      .insert({
        official_email: officialEmail || null,
        phone_name:     phoneName     || null,
        phone_number:   phoneNumber   || null,
        our_wa:         ourWA,
        your_wa:        yourWA,
        platforms:      platforms,
        remarks:        remarks       || null
      });

    if (error) throw new Error(error.message);

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Supabase error:', err);
    return res.status(500).json({ error: err.message });
  }
};
