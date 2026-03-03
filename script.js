/**
 * ResumeIQ — Frontend Script
 * Developed by Kethan
 */

// ============================================================
// SPLASH SCREEN
// ============================================================
(function initSplash() {
  const phrases = ['Smart Resume Analysis', 'Zero AI APIs. Pure Logic.', 'Built by Kethan'];
  const subEl = document.getElementById('splashSub');
  const progressEl = document.getElementById('splashProgress');
  const splashEl = document.getElementById('splash');
  const appEl = document.getElementById('app');

  let pi = 0, ci = 0, deleting = false;
  function typeIt() {
    const phrase = phrases[pi];
    if (subEl) subEl.textContent = deleting ? phrase.slice(0, ci--) : phrase.slice(0, ci++);
    if (!deleting && ci > phrase.length) { deleting = true; setTimeout(typeIt, 900); return; }
    if (deleting && ci < 0) { deleting = false; pi = (pi + 1) % phrases.length; ci = 0; setTimeout(typeIt, 300); return; }
    setTimeout(typeIt, deleting ? 30 : 60);
  }
  setTimeout(typeIt, 500);

  let pct = 0;
  const iv = setInterval(() => {
    pct += Math.random() * 5 + 1;
    if (pct >= 100) { pct = 100; clearInterval(iv); }
    if (progressEl) progressEl.style.width = pct + '%';
    if (pct >= 100) {
      setTimeout(() => {
        if (splashEl) splashEl.classList.add('fade-out');
        if (appEl) appEl.classList.remove('hidden');
        setTimeout(() => { if (splashEl) splashEl.style.display = 'none'; }, 800);
      }, 400);
    }
  }, 50);

  // Particles
  const pc = document.getElementById('splashParticles');
  if (pc) {
    for (let i = 0; i < 45; i++) {
      const p = document.createElement('div');
      const size = Math.random() * 4 + 1;
      Object.assign(p.style, {
        position: 'absolute', width: size + 'px', height: size + 'px', borderRadius: '50%',
        background: Math.random() > 0.5 ? 'rgba(0,245,255,0.5)' : 'rgba(123,47,255,0.5)',
        left: Math.random() * 100 + 'vw', top: Math.random() * 100 + 'vh',
        animation: `particle-float ${4 + Math.random() * 6}s ${Math.random() * 4}s ease-in-out infinite alternate`
      });
      pc.appendChild(p);
    }
  }
  const s = document.createElement('style');
  const tx = ((Math.random() - 0.5) * 70).toFixed(0);
  const ty = ((Math.random() - 0.5) * 70).toFixed(0);
  s.textContent = `@keyframes particle-float{from{transform:translate(0,0) scale(1)}to{transform:translate(${tx}px,${ty}px) scale(1.4)}}`;
  document.head.appendChild(s);
})();

// ============================================================
// TAB SWITCHING
// ============================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('tab-' + btn.dataset.tab);
    if (panel) panel.classList.add('active');
  });
});

// ============================================================
// FILE UPLOAD ZONES
// ============================================================
function setupUploadZone(zoneId, inputId, infoId, nameId) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  const info = document.getElementById(infoId);
  const nameEl = document.getElementById(nameId);
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  });
  input.addEventListener('change', () => { if (input.files[0]) setFile(input.files[0]); });

  function setFile(file) {
    if (nameEl) nameEl.textContent = file.name;
    if (info) info.classList.remove('hidden');
    zone.classList.add('has-file');
    zone.style.borderColor = 'rgba(0,255,136,0.5)';
  }
}
setupUploadZone('studentUploadZone', 'studentFile', 'studentFileInfo', 'studentFileName');
setupUploadZone('hrUploadZone', 'hrFile', 'hrFileInfo', 'hrFileName');

// ============================================================
// LOADING OVERLAY
// ============================================================
function showLoading(msg) {
  const el = document.getElementById('loadingText');
  if (el) el.textContent = msg || 'Analyzing...';
  const ov = document.getElementById('loadingOverlay');
  if (ov) ov.classList.remove('hidden');
}
function hideLoading() {
  const ov = document.getElementById('loadingOverlay');
  if (ov) ov.classList.add('hidden');
}

// ============================================================
// HELPERS
// ============================================================
function scoreGrade(n) {
  if (n >= 80) return { label: 'Excellent', color: '#00ff88' };
  if (n >= 65) return { label: 'Good', color: '#7eff6e' };
  if (n >= 50) return { label: 'Average', color: '#ffb700' };
  if (n >= 35) return { label: 'Fair', color: '#ff8c42' };
  return { label: 'Needs Work', color: '#ff6b6b' };
}

function skillTagsHtml(skills, type) {
  if (!skills || !skills.length) return '<span class="no-data">None detected</span>';
  return skills.map(s => `<span class="skill-tag ${type || ''}">${type === 'matched' ? '✓ ' : type === 'missing' ? '✗ ' : ''}${s}</span>`).join('');
}

function scoreCircleSvg(pct, color) {
  const r = 48, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return `<svg viewBox="0 0 110 110" width="110" height="110">
    <circle cx="55" cy="55" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>
    <circle cx="55" cy="55" r="${r}" fill="none" stroke="${color}" stroke-width="8"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"
      transform="rotate(-90 55 55)" style="transition:stroke-dashoffset 1s ease"/>
  </svg>`;
}

// ============================================================
// STUDENT MODE
// ============================================================
const studentBtn = document.getElementById('studentAnalyzeBtn');
if (studentBtn) {
  studentBtn.addEventListener('click', async () => {
    const file = document.getElementById('studentFile').files[0];
    const jd = document.getElementById('studentJD').value.trim();
    if (!file) { showToast('Please upload your resume file.', 'error'); return; }
    if (!jd) { showToast('Please enter a job title or description.', 'error'); return; }

    showLoading('Analyzing your resume...');
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jd);

    try {
      const resp = await fetch('/api/analyze/student', { method: 'POST', body: formData });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      renderStudentResults(data);
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      hideLoading();
    }
  });
}

function renderStudentResults(d) {
  // Safe defaults for all fields
  const score = d.score || 0;
  const matchPct = d.matchPercent || 0;
  const sim = d.similarity || 0;
  const matched = d.matchedSkills || [];
  const missing = (d.missingSkills || []).slice(0, 15);
  const resumeSkills = d.resumeSkills || [];
  const suggestions = d.suggestions || [];
  const wordCount = d.wordCount || 0;
  const skillCount = d.skillCount || resumeSkills.length;
  const jdSkills = d.jdSkills || [];

  const sg = scoreGrade(score);
  const mg = scoreGrade(matchPct);

  const panel = document.getElementById('studentResults');
  if (!panel) return;

  panel.innerHTML = `
    <div class="results-content fade-in-up" style="padding:28px;display:flex;flex-direction:column;gap:22px;">

      <!-- Score Row -->
      <div class="score-row">
        <div class="score-card">
          <div class="score-circle-wrap">
            ${scoreCircleSvg(score, sg.color)}
            <div class="score-circle-inner">
              <span class="score-big" style="color:${sg.color}">${score}</span>
              <span class="score-unit">/100</span>
            </div>
          </div>
          <span class="score-label">Resume Score</span>
          <span class="score-grade" style="color:${sg.color}">${sg.label}</span>
        </div>
        <div class="score-card">
          <div class="score-circle-wrap">
            ${scoreCircleSvg(matchPct, mg.color)}
            <div class="score-circle-inner">
              <span class="score-big" style="color:${mg.color}">${matchPct}</span>
              <span class="score-unit">%</span>
            </div>
          </div>
          <span class="score-label">Skill Match</span>
          <span class="score-grade" style="color:${mg.color}">${matched.length} / ${jdSkills.length || matched.length + missing.length} skills</span>
        </div>
        <div class="score-card">
          <div class="score-circle-wrap">
            ${scoreCircleSvg(sim, '#7b2fff')}
            <div class="score-circle-inner">
              <span class="score-big" style="color:#7b2fff">${sim}</span>
              <span class="score-unit">%</span>
            </div>
          </div>
          <span class="score-label">JD Similarity</span>
          <span class="score-grade" style="color:#7b2fff">${wordCount} words</span>
        </div>
      </div>

      <!-- Matched Skills -->
      <div class="result-section">
        <div class="result-section-header">
          <span class="result-section-icon" style="background:rgba(0,255,136,0.12);color:#00ff88">✓</span>
          <p class="result-section-title">Matched Skills <span class="rs-count">${matched.length}</span></p>
        </div>
        <div class="skills-wrap">${skillTagsHtml(matched, 'matched')}</div>
      </div>

      <!-- Missing Skills -->
      <div class="result-section">
        <div class="result-section-header">
          <span class="result-section-icon" style="background:rgba(255,107,107,0.12);color:#ff6b6b">✗</span>
          <p class="result-section-title">Missing Skills <span class="rs-count missing-count">${missing.length}</span></p>
        </div>
        <div class="skills-wrap">${missing.length ? skillTagsHtml(missing, 'missing') : '<span class="no-data">🎉 No major missing skills!</span>'}</div>
      </div>

      <!-- All Resume Skills -->
      <div class="result-section">
        <div class="result-section-header">
          <span class="result-section-icon" style="background:rgba(0,245,255,0.1);color:#00f5ff">◈</span>
          <p class="result-section-title">Your Skills Detected <span class="rs-count">${skillCount}</span></p>
        </div>
        <div class="skills-wrap">${skillTagsHtml(resumeSkills.slice(0, 30), '')}</div>
      </div>

      <!-- Suggestions -->
      <div class="result-section">
        <div class="result-section-header">
          <span class="result-section-icon" style="background:rgba(255,183,0,0.12);color:#ffb700">💡</span>
          <p class="result-section-title">Improvement Suggestions</p>
        </div>
        <ul class="suggestion-list">
          ${suggestions.map(s => `<li class="suggestion-item">${s}</li>`).join('')}
        </ul>
      </div>

      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stat-item"><span class="stat-num" style="color:var(--c1)">${wordCount}</span><span class="stat-lbl">Words</span></div>
        <div class="stat-divider"></div>
        <div class="stat-item"><span class="stat-num" style="color:var(--c2)">${skillCount}</span><span class="stat-lbl">Skills Found</span></div>
        <div class="stat-divider"></div>
        <div class="stat-item"><span class="stat-num" style="color:var(--c3)">${jdSkills.length}</span><span class="stat-lbl">JD Skills</span></div>
        <div class="stat-divider"></div>
        <div class="stat-item"><span class="stat-num" style="color:#00ff88">${matched.length}</span><span class="stat-lbl">Matched</span></div>
      </div>
    </div>
  `;
}

// ============================================================
// HR MODE
// ============================================================
const hrBtn = document.getElementById('hrAnalyzeBtn');
if (hrBtn) {
  hrBtn.addEventListener('click', async () => {
    const file = document.getElementById('hrFile').files[0];
    const jd = document.getElementById('hrJD').value.trim();
    if (!file) { showToast('Please upload a candidate resume.', 'error'); return; }

    showLoading('Generating interview questions...');
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jd || 'software engineer');

    try {
      const resp = await fetch('/api/analyze/hr', { method: 'POST', body: formData });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      renderHRResults(data);
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    } finally {
      hideLoading();
    }
  });
}

function renderHRResults(d) {
  // Safe destructure — server sends `summary`, handle both names
  const summary = d.summary || d.strengthSummary || {};
  const questions = d.questions || [];
  const matched = d.matchedSkills || [];
  const resumeSkills = d.resumeSkills || [];

  // Safe defaults for every field
  const level = summary.level || 'N/A';
  const skillCount = summary.skillCount || resumeSkills.length;
  const matchPct = summary.matchPct || 0;
  const verdict = summary.verdict || 'Analyzed';
  const strengths = summary.strengths || [];
  const overallScore = summary.overallScore || 0;
  const primaryDomain = summary.primaryDomain || 'General Technology';
  const sg = scoreGrade(overallScore);

  const panel = document.getElementById('hrResults');
  if (!panel) return;

  panel.innerHTML = `
    <div class="results-content fade-in-up" style="padding:28px;display:flex;flex-direction:column;gap:22px;">

      <!-- Candidate Summary -->
      <div class="result-section">
        <div class="result-section-header">
          <span class="result-section-icon" style="background:rgba(255,107,107,0.12);color:#ff6b6b">👤</span>
          <p class="result-section-title">Candidate Summary</p>
        </div>
        <div class="candidate-summary-grid">
          <div class="cand-score-wrap">
            ${scoreCircleSvg(overallScore, sg.color)}
            <div class="score-circle-inner">
              <span class="score-big" style="color:${sg.color}">${overallScore}</span>
              <span class="score-unit">/100</span>
            </div>
          </div>
          <div class="cand-details">
            <div class="cand-level-badge" style="background:var(--grad-hr)">${level}</div>
            <div class="cand-verdict" style="color:${sg.color}">${verdict}</div>
            <div class="cand-stats">
              <div class="cand-stat"><span class="cs-num" style="color:var(--hr-c)">${skillCount}</span><span class="cs-lbl">Skills</span></div>
              <div class="cand-stat"><span class="cs-num" style="color:var(--hr-c2)">${matchPct}%</span><span class="cs-lbl">JD Match</span></div>
              <div class="cand-stat"><span class="cs-num" style="color:#a78bfa">${primaryDomain.split(' ')[0]}</span><span class="cs-lbl">Domain</span></div>
            </div>
            ${strengths.length ? `<ul class="strength-items">${strengths.map(s=>`<li>${s}</li>`).join('')}</ul>` : ''}
          </div>
        </div>
      </div>

      <!-- Matched Skills -->
      <div class="result-section">
        <div class="result-section-header">
          <span class="result-section-icon" style="background:rgba(0,255,136,0.12);color:#00ff88">✓</span>
          <p class="result-section-title">Matched Skills <span class="rs-count">${matched.length}</span></p>
        </div>
        <div class="skills-wrap">${matched.length ? skillTagsHtml(matched,'matched') : '<span class="no-data">No matches found</span>'}</div>
      </div>

      <!-- Interview Questions -->
      <div class="result-section">
        <div class="result-section-header">
          <span class="result-section-icon" style="background:rgba(255,107,107,0.12);color:#ff6b6b">❓</span>
          <p class="result-section-title">Top 10 Interview Questions</p>
        </div>
        <ol class="questions-list">
          ${questions.map((q, i) => `
            <li class="question-item">
              <span class="q-num">Q${i + 1}</span>
              <div class="q-body">
                <p class="q-text">${q.question}</p>
                ${q.skill && q.skill !== 'general' ? `<span class="q-skill-tag">${q.skill}</span>` : ''}
              </div>
            </li>
          `).join('')}
        </ol>
      </div>

      <!-- All Resume Skills -->
      <div class="result-section">
        <div class="result-section-header">
          <span class="result-section-icon" style="background:rgba(0,245,255,0.1);color:#00f5ff">◈</span>
          <p class="result-section-title">All Candidate Skills <span class="rs-count">${resumeSkills.length}</span></p>
        </div>
        <div class="skills-wrap">${skillTagsHtml(resumeSkills.slice(0,35),'')}</div>
      </div>
    </div>
  `;
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(msg, type) {
  const existing = document.getElementById('riq-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'riq-toast';
  toast.textContent = msg;
  Object.assign(toast.style, {
    position:'fixed', bottom:'32px', left:'50%', transform:'translateX(-50%) translateY(20px)',
    background: type === 'error' ? 'rgba(255,107,107,0.95)' : 'rgba(0,255,136,0.95)',
    color: type === 'error' ? '#fff' : '#000',
    padding:'12px 28px', borderRadius:'99px', fontFamily:'var(--font-m)',
    fontSize:'0.85rem', fontWeight:'600', zIndex:'9999',
    boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
    transition:'all 0.3s ease', opacity:'0'
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================
// TEMPLATES — handled by templates.js
// ============================================================
