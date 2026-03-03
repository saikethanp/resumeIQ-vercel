/**
 * ResumeIQ — /api/analyze/hr
 * Vercel Serverless Function · Developed by Kethan
 */
const {
  extractText, extractSkills, tfidfSimilarity,
  calculateScore, generateInterviewQuestions,
  expandJobInput, tokenize, parseMultipart
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
    const jobDesc = expandJobInput(rawInput || 'software engineer');
    const resumeText = await extractText(fileBuffer, fileMime);
    if (!resumeText || resumeText.length < 30)
      return res.status(400).json({ error: 'Could not read resume. Ensure PDF has selectable text.' });

    const resumeSkills = extractSkills(resumeText);
    const jobSkills = extractSkills(jobDesc);
    const allSkills = [...resumeSkills, ...jobSkills.filter(j => !resumeSkills.find(r => r.skill===j.skill))];
    const questions = generateInterviewQuestions(allSkills);
    const resumeSkillNames = new Set(resumeSkills.map(s => s.skill));
    const matchedSkills = jobSkills.filter(s => resumeSkillNames.has(s.skill));
    const matchPct = jobSkills.length > 0
      ? Math.round((matchedSkills.length / jobSkills.length) * 100)
      : Math.min(60, resumeSkills.length * 5);
    const tfidf = tfidfSimilarity(resumeText, jobDesc);
    const score = calculateScore(matchPct, tfidf, tokenize(resumeText).length);

    const cats = {};
    resumeSkills.forEach(({ category }) => cats[category] = (cats[category]||0)+1);
    const topCat = Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
    const level = score>=80?'Senior':score>=60?'Mid-Level':score>=40?'Junior':'Entry';
    const strengths = [];
    if (resumeSkills.length > 12) strengths.push(`Broad skillset — ${resumeSkills.length} technical skills detected`);
    if (matchPct > 55) strengths.push(`Strong job alignment — ${matchPct}% match with requirements`);
    if (topCat) strengths.push(`Primary domain: ${topCat[0].replace(/_/g,' ')}`);
    if (!strengths.length) strengths.push('Resume parsed and analyzed successfully');

    const summary = {
      level,
      skillCount: resumeSkills.length,
      matchPct,
      overallScore: score,
      strengths,
      primaryDomain: topCat ? topCat[0].replace(/_/g,' ') : 'General Technology',
      verdict: score>=75?'Strong Candidate':score>=50?'Moderate Fit':'Needs Development'
    };

    return res.status(200).json({
      success: true,
      questions,
      summary,
      strengthSummary: summary,
      resumeSkills: resumeSkills.map(s => s.skill),
      jobSkills: jobSkills.map(s => s.skill),
      matchedSkills: matchedSkills.map(s => s.skill),
    });
  } catch (err) {
    console.error('HR analyze error:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed. Please try again.' });
  }
};
