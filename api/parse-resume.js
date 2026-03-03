/**
 * ResumeIQ — /api/parse-resume
 * Vercel Serverless Function · Developed by Kethan
 */
const { extractText, parseMultipart } = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fileBuffer, fileMime } = await parseMultipart(req);
    if (!fileBuffer) return res.status(400).json({ error: 'No file uploaded.' });
    const text = await extractText(fileBuffer, fileMime);
    return res.status(200).json({ success: true, text: text || '' });
  } catch (err) {
    console.error('Parse resume error:', err);
    return res.status(500).json({ error: err.message || 'Failed to parse resume.' });
  }
};
