/**
 * ResumeIQ — /api/analyze/student
 * Vercel Serverless Function · Developed by Kethan
 */
const {
  extractText, extractSkills, tfidfSimilarity,
  calculateScore, generateSuggestions, expandJobInput,
  tokenize, parseMultipart
} = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fields, fileBuffer, fileMime } = await parseMultipart(req);

    if (!fileBuffer) return res.status(400).json({ error: 'No resume file uploaded.' });
    const rawInput = (fields.jobDescription || '').trim();
    if (!rawInput) return res.status(400).json({ error: 'Please enter a job title or description.' });

    const jobDesc = expandJobInput(rawInput);
    const resumeText = await extractText(fileBuffer, fileMime);
    if (!resumeText || resumeText.length < 30)
      return res.status(400).json({ error: 'Could not read resume. Ensure PDF has selectable text.' });

    const words = tokenize(resumeText);
    const resumeSkills = extractSkills(resumeText);
    const jobSkills = extractSkills(jobDesc);
    const resumeSkillNames = new Set(resumeSkills.map(s => s.skill));
    const matchedSkills = jobSkills.filter(s => resumeSkillNames.has(s.skill));
    const missingSkills = jobSkills.filter(s => !resumeSkillNames.has(s.skill));
    const skillMatchPct = jobSkills.length > 0
      ? Math.round((matchedSkills.length / jobSkills.length) * 100)
      : Math.min(60, resumeSkills.length * 5);
    const tfidf = tfidfSimilarity(resumeText, jobDesc);
    const score = calculateScore(skillMatchPct, tfidf, words.length);

    return res.status(200).json({
      success: true,
      score,
      matchPercent: skillMatchPct,
      similarity: tfidf,
      resumeSkills: resumeSkills.map(s => s.skill),
      jdSkills: jobSkills.map(s => s.skill),
      matchedSkills: matchedSkills.map(s => s.skill),
      missingSkills: missingSkills.map(s => s.skill),
      suggestions: generateSuggestions(matchedSkills, missingSkills, score),
      wordCount: words.length,
      skillCount: resumeSkills.length
    });
  } catch (err) {
    console.error('Student analyze error:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed. Please try again.' });
  }
};
