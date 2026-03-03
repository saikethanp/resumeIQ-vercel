/**
 * ResumeIQ — IT Company Branded Resume Generator
 * templates.js — Developed by Kethan
 * Handles: upload, extraction, company selection, live preview, PDF download
 */

/* ============================================================
   COMPANY REGISTRY
   ============================================================ */
const COMPANY_REGISTRY = {
  global: [
    { id:'google',    name:'Google',        tag:'Mountain View, CA',  accent:'#4285F4', accent2:'#34A853', accent3:'#EA4335', bg:'#ffffff', logo:'google.png',       style:'google' },
    { id:'microsoft', name:'Microsoft',     tag:'Redmond, WA',        accent:'#0078D4', accent2:'#50E6FF', accent3:'#FFB900', bg:'#ffffff', logo:'microsoft.png',    style:'microsoft' },
    { id:'amazon',    name:'Amazon',        tag:'Seattle, WA',        accent:'#232F3E', accent2:'#FF9900', accent3:'#146EB4', bg:'#ffffff', logo:'amazon.png',       style:'amazon' },
    { id:'meta',      name:'Meta',          tag:'Menlo Park, CA',     accent:'#0866FF', accent2:'#1C2B33', accent3:'#42B72A', bg:'#ffffff', logo:'meta.png',         style:'meta' },
    { id:'apple',     name:'Apple',         tag:'Cupertino, CA',      accent:'#1D1D1F', accent2:'#6E6E73', accent3:'#0071E3', bg:'#ffffff', logo:'apple.png',        style:'apple' },
    { id:'ibm',       name:'IBM',           tag:'Armonk, NY',         accent:'#0F62FE', accent2:'#161616', accent3:'#42BE65', bg:'#ffffff', logo:'ibm.png',          style:'ibm' },
    { id:'oracle',    name:'Oracle',        tag:'Austin, TX',         accent:'#C74634', accent2:'#1A1A1A', accent3:'#3D7EAA', bg:'#ffffff', logo:'oracle.png',       style:'oracle' },
    { id:'salesforce',name:'Salesforce',    tag:'San Francisco, CA',  accent:'#00A1E0', accent2:'#032D60', accent3:'#1798C1', bg:'#ffffff', logo:'salesforce.png',   style:'salesforce' },
    { id:'nvidia',    name:'NVIDIA',        tag:'Santa Clara, CA',    accent:'#76B900', accent2:'#1A1A1A', accent3:'#DDDDDD', bg:'#1a1a1a', logo:'nvidia.png',       style:'nvidia' },
    { id:'intel',     name:'Intel',         tag:'Santa Clara, CA',    accent:'#0068B5', accent2:'#1C1C1C', accent3:'#00C7FD', bg:'#ffffff', logo:'intel.png',        style:'intel' },
  ],
  indian: [
    { id:'tcs',         name:'TCS',           tag:'Mumbai, India',      accent:'#0078C8', accent2:'#003366', accent3:'#E87722', bg:'#ffffff', logo:'tcs.png',          style:'tcs' },
    { id:'infosys',     name:'Infosys',       tag:'Bengaluru, India',   accent:'#007CC3', accent2:'#1A1A1A', accent3:'#F7A200', bg:'#ffffff', logo:'infosys.png',      style:'infosys' },
    { id:'wipro',       name:'Wipro',         tag:'Bengaluru, India',   accent:'#221F72', accent2:'#9E1B32', accent3:'#F7A800', bg:'#ffffff', logo:'wipro.png',        style:'wipro' },
    { id:'hcl',         name:'HCL Technologies',tag:'Noida, India',     accent:'#0074C2', accent2:'#1E2D3D', accent3:'#00A3E0', bg:'#ffffff', logo:'hcl.png',          style:'hcl' },
    { id:'techmahindra',name:'Tech Mahindra', tag:'Pune, India',        accent:'#E31B23', accent2:'#1B1B1B', accent3:'#939598', bg:'#ffffff', logo:'techmahindra.png', style:'techmahindra' },
    { id:'mindtree',    name:'Mindtree',      tag:'Bengaluru, India',   accent:'#007DC5', accent2:'#1A1A1A', accent3:'#8DC63F', bg:'#ffffff', logo:'mindtree.png',     style:'mindtree' },
    { id:'zoho',        name:'Zoho',          tag:'Chennai, India',     accent:'#E42527', accent2:'#1E1E1E', accent3:'#F0A500', bg:'#ffffff', logo:'zoho.png',         style:'zoho' },
    { id:'freshworks',  name:'Freshworks',    tag:'San Mateo, CA',      accent:'#25C16F', accent2:'#171C26', accent3:'#FF6634', bg:'#ffffff', logo:'freshworks.png',   style:'freshworks' },
  ]
};

/* ============================================================
   RESUME DATA STATE
   ============================================================ */
let RESUME_DATA = null;
let ACTIVE_COMPANY = null;

/* ============================================================
   TEXT EXTRACTOR (client-side PDF via pdf.js or plain text)
   ============================================================ */
async function extractResumeData(file) {
  let raw = '';
  if (file.type === 'application/pdf') {
    raw = await extractPdfText(file);
  } else {
    raw = await file.text();
  }
  return parseResumeText(raw);
}

async function extractPdfText(file) {
  // Use server-side extraction via existing /api/analyze/student endpoint
  // We just send the file and a dummy JD, then grab resumeText indirectly
  // Actually: use FileReader + send to a dedicated parse endpoint
  // Since we only have student/hr endpoints, we'll use a FormData trick:
  // Send to /api/parse-resume if it exists, else fall back to reading as text
  try {
    const fd = new FormData();
    fd.append('resume', file);
    const resp = await fetch('/api/parse-resume', { method: 'POST', body: fd });
    if (resp.ok) {
      const d = await resp.json();
      return d.text || '';
    }
  } catch(e) {}
  // Fallback: read raw bytes as string (works for text-based PDFs)
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result || '');
    reader.readAsText(file);
  });
}

function parseResumeText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const full = text;

  // Helpers
  const grab = (patterns) => {
    for (const p of patterns) {
      const m = full.match(p);
      if (m) return m[1] ? m[1].trim() : m[0].trim();
    }
    return '';
  };

  // Name: usually first non-empty line that looks like a name (2-4 words, no special chars)
  let name = '';
  for (const line of lines.slice(0, 6)) {
    if (/^[A-Z][a-zA-Z .'-]{2,40}$/.test(line) && line.split(' ').length >= 2 && !line.includes('@')) {
      name = line; break;
    }
  }

  const email = grab([/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/]);
  const phone = grab([/(\+?\d[\d\s\-().]{8,16}\d)/]);
  const linkedin = grab([/(linkedin\.com\/in\/[\w-]+)/i, /(linkedin\.com[^\s]+)/i]);

  // Title: line after name that looks like a job title
  let title = '';
  const nameIdx = lines.findIndex(l => l === name);
  const titleCandidates = lines.slice(Math.max(0, nameIdx), nameIdx + 5);
  for (const l of titleCandidates) {
    if (l !== name && l !== email && !l.includes('@') && !l.match(/\d{10}/) && l.length > 5 && l.length < 80 && !l.match(/https?:/)) {
      title = l; break;
    }
  }

  // Sections: find by headers
  const sectionMap = extractSections(lines);

  const summary = sectionMap['summary'] || sectionMap['objective'] || sectionMap['profile'] || '';
  const skills = extractSkillsText(sectionMap['skills'] || sectionMap['technical skills'] || sectionMap['core competencies'] || '');
  const experience = extractExperienceText(sectionMap['experience'] || sectionMap['work experience'] || sectionMap['employment'] || '');
  const education = extractEducationText(sectionMap['education'] || sectionMap['academic'] || '');
  const projects = extractProjectsText(sectionMap['projects'] || sectionMap['personal projects'] || '');
  const certifications = sectionMap['certifications'] || sectionMap['certifications & awards'] || sectionMap['achievements'] || '';

  // Location: look for city/state patterns
  const location = grab([/(?:location|address|city)[:\s]+([^\n,]+(?:,\s*[A-Z]{2})?)/i, /([A-Z][a-z]+,\s*[A-Z][a-z]+(?:,\s*India)?)/]);

  return {
    name: name || 'Your Name',
    title: title || 'Software Professional',
    email, phone, linkedin, location,
    summary: summary.slice(0, 600),
    skills, experience, education, projects,
    certifications
  };
}

function extractSections(lines) {
  const HEADERS = ['summary','objective','profile','skills','technical skills','core competencies',
    'experience','work experience','employment history','education','academic background',
    'projects','personal projects','certifications','achievements','awards','languages'];
  const map = {};
  let current = null;
  let buf = [];

  for (const line of lines) {
    const lower = line.toLowerCase().replace(/[^a-z\s]/g,'').trim();
    const matched = HEADERS.find(h => lower === h || lower.startsWith(h));
    if (matched && line.length < 60) {
      if (current) map[current] = buf.join('\n').trim();
      current = matched;
      buf = [];
    } else if (current) {
      buf.push(line);
    }
  }
  if (current) map[current] = buf.join('\n').trim();
  return map;
}

function extractSkillsText(raw) {
  if (!raw) return '';
  // Return comma-joined skills
  const skills = raw.split(/[,|\n•\-·]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 40);
  return skills.slice(0, 30).join(', ');
}

function extractExperienceText(raw) {
  if (!raw) return '';
  // Return raw lines — user can edit
  return raw.split('\n').filter(l => l.trim()).slice(0, 20).join('\n');
}

function extractEducationText(raw) {
  if (!raw) return '';
  return raw.split('\n').filter(l => l.trim()).slice(0, 10).join('\n');
}

function extractProjectsText(raw) {
  if (!raw) return '';
  return raw.split('\n').filter(l => l.trim()).slice(0, 15).join('\n');
}

/* ============================================================
   UPLOAD ZONE SETUP
   ============================================================ */
function setupTmplUpload() {
  const zone = document.getElementById('tmplUploadZone');
  const input = document.getElementById('tmplFile');
  const fileInfo = document.getElementById('tmplFileInfo');
  const fileName = document.getElementById('tmplFileName');
  const fileBadge = document.getElementById('tmplFileBadge');
  const extracted = document.getElementById('tmplExtracted');
  const step2 = document.getElementById('tmplStep2');
  const clearBtn = document.getElementById('tmplFileClear');

  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f) handleTmplFile(f);
  });
  input.addEventListener('change', () => { if (input.files[0]) handleTmplFile(input.files[0]); });

  clearBtn && clearBtn.addEventListener('click', () => {
    input.value = '';
    fileInfo.classList.add('hidden');
    extracted.classList.add('hidden');
    zone.classList.remove('has-file');
    step2.classList.add('tmpl-step-locked');
    RESUME_DATA = null;
    hideStep3();
  });

  async function handleTmplFile(file) {
    fileName.textContent = file.name;
    fileBadge.textContent = 'Parsing...';
    fileBadge.className = 'tmpl-file-badge parsing';
    fileInfo.classList.remove('hidden');
    zone.classList.add('has-file');
    extracted.classList.add('hidden');

    try {
      RESUME_DATA = await extractResumeData(file);
      fileBadge.textContent = '✓ Parsed';
      fileBadge.className = 'tmpl-file-badge success';
      renderExtractedPreview(RESUME_DATA);
      extracted.classList.remove('hidden');
      step2.classList.remove('tmpl-step-locked');
      step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch(e) {
      fileBadge.textContent = '✗ Error';
      fileBadge.className = 'tmpl-file-badge error';
      showToast('Could not parse file: ' + e.message, 'error');
    }
  }
}

/* ============================================================
   EXTRACTED DATA PREVIEW
   ============================================================ */
function renderExtractedPreview(d) {
  const grid = document.getElementById('tmplExtractedGrid');
  if (!grid) return;

  const fields = [
    { label: 'Name', val: d.name },
    { label: 'Title', val: d.title },
    { label: 'Email', val: d.email },
    { label: 'Phone', val: d.phone },
    { label: 'Location', val: d.location },
    { label: 'LinkedIn', val: d.linkedin },
    { label: 'Skills', val: d.skills ? d.skills.split(',').slice(0,6).join(', ') + (d.skills.split(',').length > 6 ? '...' : '') : '' },
    { label: 'Summary', val: d.summary ? d.summary.slice(0,120) + (d.summary.length > 120 ? '...' : '') : '' },
  ].filter(f => f.val);

  grid.innerHTML = fields.map(f => `
    <div class="tmpl-ext-field">
      <span class="tmpl-ext-label">${f.label}</span>
      <span class="tmpl-ext-val">${f.val}</span>
    </div>
  `).join('');

  // Populate edit fields
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('te_name', d.name); set('te_title', d.title); set('te_email', d.email);
  set('te_phone', d.phone); set('te_location', d.location); set('te_linkedin', d.linkedin);
  set('te_summary', d.summary); set('te_skills', d.skills);
  set('te_experience', d.experience); set('te_education', d.education);
  set('te_projects', d.projects); set('te_certifications', d.certifications);
}

function setupEditPanel() {
  const editBtn = document.getElementById('tmplEditBtn');
  const editPanel = document.getElementById('tmplEditPanel');
  const editClose = document.getElementById('tmplEditClose');
  const saveBtn = document.getElementById('tmplSaveEdit');

  editBtn && editBtn.addEventListener('click', () => {
    editPanel.classList.remove('hidden');
    editPanel.scrollIntoView({ behavior:'smooth', block:'start' });
  });
  editClose && editClose.addEventListener('click', () => editPanel.classList.add('hidden'));
  saveBtn && saveBtn.addEventListener('click', () => {
    const get = id => document.getElementById(id)?.value || '';
    RESUME_DATA = {
      name: get('te_name'), title: get('te_title'), email: get('te_email'),
      phone: get('te_phone'), location: get('te_location'), linkedin: get('te_linkedin'),
      summary: get('te_summary'), skills: get('te_skills'),
      experience: get('te_experience'), education: get('te_education'),
      projects: get('te_projects'), certifications: get('te_certifications')
    };
    renderExtractedPreview(RESUME_DATA);
    editPanel.classList.add('hidden');
    if (ACTIVE_COMPANY) renderResumePreview(ACTIVE_COMPANY, RESUME_DATA);
    showToast('Changes saved!', 'success');
  });
}

/* ============================================================
   COMPANY GRID RENDERER
   ============================================================ */
function renderCompanyGrid() {
  renderGroup('tmplGlobalGrid', COMPANY_REGISTRY.global);
  renderGroup('tmplIndianGrid', COMPANY_REGISTRY.indian);
}

function renderGroup(gridId, companies) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = companies.map(c => `
    <div class="tmpl-company-card" data-id="${c.id}" title="Use ${c.name} template">
      <div class="tmpl-company-card-inner">
        <div class="tmpl-company-logo-wrap" style="border-color:${c.accent}22">
          <img src="/assets/logos/${c.logo}" alt="${c.name}" class="tmpl-company-logo"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
          <div class="tmpl-logo-fallback" style="display:none;background:${c.accent};color:#fff">
            ${c.name.slice(0,2).toUpperCase()}
          </div>
        </div>
        <div class="tmpl-company-info">
          <span class="tmpl-company-name">${c.name}</span>
          <span class="tmpl-company-tag">${c.tag}</span>
        </div>
        <div class="tmpl-company-accent-bar" style="background:${c.accent}"></div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.tmpl-company-card').forEach(card => {
    card.addEventListener('click', () => {
      if (!RESUME_DATA) { showToast('Please upload your resume first.', 'error'); return; }
      document.querySelectorAll('.tmpl-company-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const company = findCompany(card.dataset.id);
      if (company) { ACTIVE_COMPANY = company; showStep3(company); }
    });
  });
}

function findCompany(id) {
  return [...COMPANY_REGISTRY.global, ...COMPANY_REGISTRY.indian].find(c => c.id === id);
}

/* ============================================================
   STEP 3: PREVIEW
   ============================================================ */
function showStep3(company) {
  const step3 = document.getElementById('tmplStep3');
  step3.classList.remove('hidden', 'tmpl-step-locked');
  renderResumePreview(company, RESUME_DATA);
  setTimeout(() => step3.scrollIntoView({ behavior:'smooth', block:'start' }), 100);
}

function hideStep3() {
  const step3 = document.getElementById('tmplStep3');
  step3.classList.add('hidden');
  ACTIVE_COMPANY = null;
}

/* ============================================================
   RESUME PREVIEW RENDERER (HTML → live preview)
   ============================================================ */
function renderResumePreview(company, data) {
  const container = document.getElementById('tmplResumePreview');
  if (!container || !data) return;
  const html = TEMPLATE_RENDERERS[company.style]
    ? TEMPLATE_RENDERERS[company.style](company, data)
    : TEMPLATE_RENDERERS.default(company, data);
  container.innerHTML = html;
}

/* ============================================================
   SHARED RESUME HELPERS
   ============================================================ */
function fmtSkills(skills) {
  if (!skills) return '';
  return skills.split(',').map(s => s.trim()).filter(Boolean)
    .map(s => `<span class="rv-skill-tag">${s}</span>`).join('');
}

function fmtExperience(exp) {
  if (!exp) return '';
  return exp.split('\n').filter(l => l.trim()).map(line => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 2) {
      return `<div class="rv-exp-item">
        <div class="rv-exp-header">
          <strong class="rv-exp-title">${parts[0]}</strong>
          <span class="rv-exp-duration">${parts[2] || ''}</span>
        </div>
        <div class="rv-exp-company">${parts[1]}</div>
        ${parts[3] ? `<p class="rv-exp-desc">${parts[3]}</p>` : ''}
      </div>`;
    }
    return `<div class="rv-exp-item"><p class="rv-exp-desc">${line}</p></div>`;
  }).join('');
}

function fmtEducation(edu) {
  if (!edu) return '';
  return edu.split('\n').filter(l => l.trim()).map(line => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 2) {
      return `<div class="rv-edu-item">
        <strong class="rv-edu-degree">${parts[0]}</strong>
        <span class="rv-edu-inst">${parts[1]}</span>
        ${parts[2] || parts[3] ? `<span class="rv-edu-meta">${[parts[2],parts[3]].filter(Boolean).join(' · ')}</span>` : ''}
      </div>`;
    }
    return `<div class="rv-edu-item"><span>${line}</span></div>`;
  }).join('');
}

function fmtProjects(proj) {
  if (!proj) return '';
  return proj.split('\n').filter(l => l.trim()).map(line => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 2) {
      return `<div class="rv-proj-item">
        <strong class="rv-proj-name">${parts[0]}</strong>
        ${parts[1] ? `<span class="rv-proj-tech">${parts[1]}</span>` : ''}
        ${parts[2] ? `<p class="rv-proj-desc">${parts[2]}</p>` : ''}
      </div>`;
    }
    return `<div class="rv-proj-item"><p>${line}</p></div>`;
  }).join('');
}

function fmtCerts(certs) {
  if (!certs) return '';
  return certs.split(',').map(c => c.trim()).filter(Boolean)
    .map(c => `<li>${c}</li>`).join('');
}

function sec(title, content, accentColor) {
  if (!content || !content.trim()) return '';
  return `<div class="rv-section">
    <div class="rv-section-title" style="--rv-accent:${accentColor || '#333'}">${title}</div>
    <div class="rv-section-body">${content}</div>
  </div>`;
}

function contactLine(data) {
  return [data.email, data.phone, data.location, data.linkedin]
    .filter(Boolean).join(' &nbsp;·&nbsp; ');
}

/* ============================================================
   TEMPLATE RENDERERS — one per company style
   ============================================================ */
const TEMPLATE_RENDERERS = {

  /* ---- GOOGLE: Clean, minimal, whitespace-heavy ---- */
  google(c, d) {
    return `<div class="rv rv-google" style="--acc:${c.accent};--acc2:${c.accent2};--acc3:${c.accent3}">
      <div class="rv-google-header">
        <div class="rv-google-name-block">
          <h1 class="rv-name">${d.name}</h1>
          <p class="rv-title">${d.title}</p>
          <p class="rv-contact">${contactLine(d)}</p>
        </div>
        <div class="rv-google-logo">
          <img src="/assets/logos/${c.logo}" alt="Google" onerror="this.style.display='none'"/>
        </div>
      </div>
      <div class="rv-google-rainbow"><span style="background:#4285F4"></span><span style="background:#DB4437"></span><span style="background:#F4B400"></span><span style="background:#0F9D58"></span></div>
      <div class="rv-body">
        ${sec('Summary', `<p>${d.summary}</p>`, c.accent)}
        ${sec('Experience', fmtExperience(d.experience), c.accent)}
        ${sec('Education', fmtEducation(d.education), c.accent)}
        ${d.skills ? sec('Skills', `<div class="rv-skills-wrap">${fmtSkills(d.skills)}</div>`, c.accent) : ''}
        ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        ${d.certifications ? sec('Certifications', `<ul class="rv-list">${fmtCerts(d.certifications)}</ul>`, c.accent) : ''}
      </div>
    </div>`;
  },

  /* ---- MICROSOFT: Structured, blue accent sidebar ---- */
  microsoft(c, d) {
    return `<div class="rv rv-microsoft" style="--acc:${c.accent};--acc2:${c.accent2}">
      <div class="rv-ms-header">
        <div>
          <h1 class="rv-name">${d.name}</h1>
          <p class="rv-title" style="color:${c.accent}">${d.title}</p>
          <p class="rv-contact">${contactLine(d)}</p>
        </div>
        <img src="/assets/logos/${c.logo}" alt="Microsoft" class="rv-header-logo" onerror="this.style.display='none'"/>
      </div>
      <div class="rv-ms-body">
        <div class="rv-ms-main">
          ${sec('Professional Summary', `<p>${d.summary}</p>`, c.accent)}
          ${sec('Experience', fmtExperience(d.experience), c.accent)}
          ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        </div>
        <div class="rv-ms-sidebar">
          ${d.skills ? `<div class="rv-sidebar-sec"><div class="rv-sidebar-title" style="background:${c.accent}">Skills</div><div class="rv-skills-wrap rv-skills-col">${fmtSkills(d.skills)}</div></div>` : ''}
          ${sec('Education', fmtEducation(d.education), c.accent)}
          ${d.certifications ? `<div class="rv-sidebar-sec"><div class="rv-sidebar-title" style="background:${c.accent}">Certifications</div><ul class="rv-list">${fmtCerts(d.certifications)}</ul></div>` : ''}
        </div>
      </div>
    </div>`;
  },

  /* ---- AMAZON: Impact-driven, bold, dark header ---- */
  amazon(c, d) {
    return `<div class="rv rv-amazon" style="--acc:${c.accent};--acc2:${c.accent2}">
      <div class="rv-amazon-header">
        <div class="rv-amazon-left">
          <img src="/assets/logos/${c.logo}" alt="Amazon" class="rv-amz-logo" onerror="this.style.display='none'"/>
        </div>
        <div class="rv-amazon-right">
          <h1 class="rv-name rv-name-light">${d.name}</h1>
          <p class="rv-title-light">${d.title}</p>
          <p class="rv-contact rv-contact-light">${contactLine(d)}</p>
        </div>
      </div>
      <div class="rv-amazon-stripe"></div>
      <div class="rv-body rv-body-pad">
        ${sec('Professional Summary', `<p>${d.summary}</p>`, c.accent2)}
        ${sec('Experience', fmtExperience(d.experience), c.accent2)}
        ${sec('Education', fmtEducation(d.education), c.accent2)}
        ${d.skills ? sec('Technical Skills', `<div class="rv-skills-wrap">${fmtSkills(d.skills)}</div>`, c.accent2) : ''}
        ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent2) : ''}
        ${d.certifications ? sec('Certifications', `<ul class="rv-list">${fmtCerts(d.certifications)}</ul>`, c.accent2) : ''}
      </div>
    </div>`;
  },

  /* ---- META: Modern, gradient, clean ---- */
  meta(c, d) {
    return `<div class="rv rv-meta" style="--acc:${c.accent};--acc2:${c.accent2}">
      <div class="rv-meta-header">
        <img src="/assets/logos/${c.logo}" alt="Meta" class="rv-meta-logo" onerror="this.style.display='none'"/>
        <div class="rv-meta-name-block">
          <h1 class="rv-name rv-name-gradient" style="background:linear-gradient(135deg,${c.accent},#9B59B6)">${d.name}</h1>
          <p class="rv-title">${d.title}</p>
          <p class="rv-contact">${contactLine(d)}</p>
        </div>
      </div>
      <div class="rv-meta-divider" style="background:linear-gradient(90deg,${c.accent},#9B59B6,transparent)"></div>
      <div class="rv-body rv-body-pad">
        ${sec('About', `<p>${d.summary}</p>`, c.accent)}
        ${sec('Experience', fmtExperience(d.experience), c.accent)}
        ${sec('Education', fmtEducation(d.education), c.accent)}
        ${d.skills ? sec('Skills', `<div class="rv-skills-wrap">${fmtSkills(d.skills)}</div>`, c.accent) : ''}
        ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        ${d.certifications ? sec('Certifications', `<ul class="rv-list">${fmtCerts(d.certifications)}</ul>`, c.accent) : ''}
      </div>
    </div>`;
  },

  /* ---- APPLE: Ultra-minimal, typography-first ---- */
  apple(c, d) {
    return `<div class="rv rv-apple" style="--acc:${c.accent}">
      <div class="rv-apple-header">
        <h1 class="rv-apple-name">${d.name}</h1>
        <p class="rv-apple-title">${d.title}</p>
        <p class="rv-apple-contact">${contactLine(d)}</p>
        <img src="/assets/logos/${c.logo}" alt="Apple" class="rv-apple-logo" onerror="this.style.display='none'"/>
      </div>
      <hr class="rv-apple-hr"/>
      <div class="rv-body rv-apple-body">
        ${sec('Summary', `<p>${d.summary}</p>`, c.accent3)}
        ${sec('Experience', fmtExperience(d.experience), c.accent3)}
        ${sec('Education', fmtEducation(d.education), c.accent3)}
        ${d.skills ? sec('Skills', `<div class="rv-skills-wrap">${fmtSkills(d.skills)}</div>`, c.accent3) : ''}
        ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent3) : ''}
        ${d.certifications ? sec('Certifications', `<ul class="rv-list">${fmtCerts(d.certifications)}</ul>`, c.accent3) : ''}
      </div>
    </div>`;
  },

  /* ---- IBM: Grid-based, technical, carbon design ---- */
  ibm(c, d) {
    return `<div class="rv rv-ibm" style="--acc:${c.accent};--acc2:${c.accent2}">
      <div class="rv-ibm-header" style="background:${c.accent}">
        <div>
          <h1 class="rv-name rv-name-light">${d.name}</h1>
          <p class="rv-title-light">${d.title}</p>
          <p class="rv-contact rv-contact-light">${contactLine(d)}</p>
        </div>
        <img src="/assets/logos/${c.logo}" alt="IBM" class="rv-header-logo rv-header-logo-light" onerror="this.style.display='none'"/>
      </div>
      <div class="rv-ibm-body">
        <div class="rv-ibm-main">
          ${sec('Summary', `<p>${d.summary}</p>`, c.accent)}
          ${sec('Experience', fmtExperience(d.experience), c.accent)}
          ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        </div>
        <div class="rv-ibm-sidebar" style="border-color:${c.accent}">
          ${d.skills ? `<div class="rv-sidebar-sec"><div class="rv-sidebar-title" style="background:${c.accent}">Skills</div><div class="rv-skills-wrap rv-skills-col">${fmtSkills(d.skills)}</div></div>` : ''}
          ${sec('Education', fmtEducation(d.education), c.accent)}
          ${d.certifications ? `<div class="rv-sidebar-sec"><div class="rv-sidebar-title" style="background:${c.accent}">Certifications</div><ul class="rv-list">${fmtCerts(d.certifications)}</ul></div>` : ''}
        </div>
      </div>
    </div>`;
  },

  /* ---- ORACLE: Bold red, corporate structured ---- */
  oracle(c, d) {
    return `<div class="rv rv-oracle" style="--acc:${c.accent};--acc2:${c.accent2}">
      <div class="rv-oracle-header">
        <div class="rv-oracle-stripe" style="background:${c.accent}"></div>
        <div class="rv-oracle-top">
          <div>
            <h1 class="rv-name">${d.name}</h1>
            <p class="rv-title" style="color:${c.accent}">${d.title}</p>
            <p class="rv-contact">${contactLine(d)}</p>
          </div>
          <img src="/assets/logos/${c.logo}" alt="Oracle" class="rv-header-logo" onerror="this.style.display='none'"/>
        </div>
      </div>
      <div class="rv-body rv-body-pad">
        ${sec('Professional Summary', `<p>${d.summary}</p>`, c.accent)}
        ${sec('Experience', fmtExperience(d.experience), c.accent)}
        ${sec('Education', fmtEducation(d.education), c.accent)}
        ${d.skills ? sec('Technical Skills', `<div class="rv-skills-wrap">${fmtSkills(d.skills)}</div>`, c.accent) : ''}
        ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        ${d.certifications ? sec('Certifications', `<ul class="rv-list">${fmtCerts(d.certifications)}</ul>`, c.accent) : ''}
      </div>
    </div>`;
  },

  /* ---- SALESFORCE: Sky blue, cloud-inspired ---- */
  salesforce(c, d) {
    return `<div class="rv rv-salesforce" style="--acc:${c.accent};--acc2:${c.accent2}">
      <div class="rv-sf-header" style="background:linear-gradient(135deg,${c.accent2},${c.accent})">
        <div>
          <h1 class="rv-name rv-name-light">${d.name}</h1>
          <p class="rv-title-light">${d.title}</p>
          <p class="rv-contact rv-contact-light">${contactLine(d)}</p>
        </div>
        <img src="/assets/logos/${c.logo}" alt="Salesforce" class="rv-header-logo rv-header-logo-light" onerror="this.style.display='none'"/>
      </div>
      <div class="rv-body rv-body-pad">
        ${sec('Summary', `<p>${d.summary}</p>`, c.accent)}
        ${sec('Experience', fmtExperience(d.experience), c.accent)}
        ${sec('Education', fmtEducation(d.education), c.accent)}
        ${d.skills ? sec('Skills', `<div class="rv-skills-wrap">${fmtSkills(d.skills)}</div>`, c.accent) : ''}
        ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        ${d.certifications ? sec('Certifications', `<ul class="rv-list">${fmtCerts(d.certifications)}</ul>`, c.accent) : ''}
      </div>
    </div>`;
  },

  /* ---- NVIDIA: Dark, green glow, GPU aesthetic ---- */
  nvidia(c, d) {
    return `<div class="rv rv-nvidia" style="--acc:${c.accent};--acc2:${c.accent2};background:#1a1a1a;color:#e5e5e5">
      <div class="rv-nvidia-header">
        <img src="/assets/logos/${c.logo}" alt="NVIDIA" class="rv-nvidia-logo" onerror="this.style.display='none'"/>
        <div class="rv-nvidia-divider" style="background:${c.accent}"></div>
        <div>
          <h1 class="rv-name" style="color:#fff">${d.name}</h1>
          <p class="rv-title" style="color:${c.accent}">${d.title}</p>
          <p class="rv-contact" style="color:#aaa">${contactLine(d)}</p>
        </div>
      </div>
      <div class="rv-body rv-body-pad">
        ${sec('Summary', `<p style="color:#ccc">${d.summary}</p>`, c.accent)}
        ${sec('Experience', fmtExperience(d.experience), c.accent)}
        ${sec('Education', fmtEducation(d.education), c.accent)}
        ${d.skills ? sec('Skills', `<div class="rv-skills-wrap">${fmtSkills(d.skills)}</div>`, c.accent) : ''}
        ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        ${d.certifications ? sec('Certifications', `<ul class="rv-list">${fmtCerts(d.certifications)}</ul>`, c.accent) : ''}
      </div>
    </div>`;
  },

  /* ---- INTEL: Blue bold, chip-inspired ---- */
  intel(c, d) {
    return `<div class="rv rv-intel" style="--acc:${c.accent}">
      <div class="rv-intel-header">
        <img src="/assets/logos/${c.logo}" alt="Intel" class="rv-header-logo" style="height:36px" onerror="this.style.display='none'"/>
        <div class="rv-intel-name-block">
          <h1 class="rv-name">${d.name}</h1>
          <p class="rv-title" style="color:${c.accent}">${d.title}</p>
          <p class="rv-contact">${contactLine(d)}</p>
        </div>
      </div>
      <div class="rv-intel-bar" style="background:linear-gradient(90deg,${c.accent},${c.accent3},transparent)"></div>
      <div class="rv-body rv-body-pad">
        ${sec('Professional Summary', `<p>${d.summary}</p>`, c.accent)}
        ${sec('Experience', fmtExperience(d.experience), c.accent)}
        ${sec('Education', fmtEducation(d.education), c.accent)}
        ${d.skills ? sec('Technical Skills', `<div class="rv-skills-wrap">${fmtSkills(d.skills)}</div>`, c.accent) : ''}
        ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        ${d.certifications ? sec('Certifications', `<ul class="rv-list">${fmtCerts(d.certifications)}</ul>`, c.accent) : ''}
      </div>
    </div>`;
  },

  /* ---- TCS: Enterprise corporate, two-column ---- */
  tcs(c, d) {
    return `<div class="rv rv-tcs" style="--acc:${c.accent};--acc2:${c.accent2}">
      <div class="rv-tcs-header" style="border-bottom:4px solid ${c.accent}">
        <div>
          <h1 class="rv-name">${d.name}</h1>
          <p class="rv-title" style="color:${c.accent}">${d.title}</p>
          <p class="rv-contact">${contactLine(d)}</p>
        </div>
        <img src="/assets/logos/${c.logo}" alt="TCS" class="rv-header-logo" onerror="this.style.display='none'"/>
      </div>
      <div class="rv-tcs-body">
        <div class="rv-tcs-main">
          ${sec('Professional Summary', `<p>${d.summary}</p>`, c.accent)}
          ${sec('Work Experience', fmtExperience(d.experience), c.accent)}
          ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        </div>
        <div class="rv-tcs-aside" style="border-left:3px solid ${c.accent}22">
          ${d.skills ? `<div class="rv-sidebar-sec"><div class="rv-sidebar-title" style="background:${c.accent}">Core Skills</div><div class="rv-skills-wrap rv-skills-col">${fmtSkills(d.skills)}</div></div>` : ''}
          ${sec('Education', fmtEducation(d.education), c.accent)}
          ${d.certifications ? `<div class="rv-sidebar-sec"><div class="rv-sidebar-title" style="background:${c.accent}">Certifications</div><ul class="rv-list">${fmtCerts(d.certifications)}</ul></div>` : ''}
        </div>
      </div>
    </div>`;
  },

  /* ---- INFOSYS: Blue structured, Indian enterprise ---- */
  infosys(c, d) {
    return `<div class="rv rv-infosys" style="--acc:${c.accent};--acc2:${c.accent2}">
      <div class="rv-infosys-header" style="background:${c.accent}">
        <div>
          <h1 class="rv-name rv-name-light">${d.name}</h1>
          <p class="rv-title-light">${d.title}</p>
          <p class="rv-contact rv-contact-light">${contactLine(d)}</p>
        </div>
        <img src="/assets/logos/${c.logo}" alt="Infosys" class="rv-header-logo rv-header-logo-light" onerror="this.style.display='none'"/>
      </div>
      <div class="rv-body rv-body-pad">
        ${sec('Profile Summary', `<p>${d.summary}</p>`, c.accent)}
        ${sec('Work Experience', fmtExperience(d.experience), c.accent)}
        ${sec('Education', fmtEducation(d.education), c.accent)}
        ${d.skills ? sec('Technical Skills', `<div class="rv-skills-wrap">${fmtSkills(d.skills)}</div>`, c.accent) : ''}
        ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        ${d.certifications ? sec('Certifications', `<ul class="rv-list">${fmtCerts(d.certifications)}</ul>`, c.accent) : ''}
      </div>
    </div>`;
  },

  /* ---- WIPRO: Purple & red, structured ---- */
  wipro(c, d) {
    return `<div class="rv rv-wipro" style="--acc:${c.accent};--acc2:${c.accent2}">
      <div class="rv-wipro-header">
        <div class="rv-wipro-top-bar" style="background:${c.accent}"></div>
        <div class="rv-wipro-top-bar" style="background:${c.accent2};width:40%"></div>
        <div class="rv-wipro-name-area">
          <div>
            <h1 class="rv-name">${d.name}</h1>
            <p class="rv-title" style="color:${c.accent}">${d.title}</p>
            <p class="rv-contact">${contactLine(d)}</p>
          </div>
          <img src="/assets/logos/${c.logo}" alt="Wipro" class="rv-header-logo" onerror="this.style.display='none'"/>
        </div>
      </div>
      <div class="rv-body rv-body-pad">
        ${sec('Professional Summary', `<p>${d.summary}</p>`, c.accent)}
        ${sec('Experience', fmtExperience(d.experience), c.accent)}
        ${sec('Education', fmtEducation(d.education), c.accent)}
        ${d.skills ? sec('Technical Skills', `<div class="rv-skills-wrap">${fmtSkills(d.skills)}</div>`, c.accent) : ''}
        ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        ${d.certifications ? sec('Certifications', `<ul class="rv-list">${fmtCerts(d.certifications)}</ul>`, c.accent) : ''}
      </div>
    </div>`;
  },

  /* ---- HCL: Deep blue, tech enterprise ---- */
  hcl(c, d) {
    return `<div class="rv rv-hcl" style="--acc:${c.accent}">
      <div class="rv-hcl-header" style="background:linear-gradient(135deg,${c.accent2},${c.accent})">
        <div>
          <h1 class="rv-name rv-name-light">${d.name}</h1>
          <p class="rv-title-light">${d.title}</p>
          <p class="rv-contact rv-contact-light">${contactLine(d)}</p>
        </div>
        <img src="/assets/logos/${c.logo}" alt="HCL" class="rv-header-logo rv-header-logo-light" onerror="this.style.display='none'"/>
      </div>
      <div class="rv-body rv-body-pad">
        ${sec('Summary', `<p>${d.summary}</p>`, c.accent)}
        ${sec('Experience', fmtExperience(d.experience), c.accent)}
        ${sec('Education', fmtEducation(d.education), c.accent)}
        ${d.skills ? sec('Skills', `<div class="rv-skills-wrap">${fmtSkills(d.skills)}</div>`, c.accent) : ''}
        ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        ${d.certifications ? sec('Certifications', `<ul class="rv-list">${fmtCerts(d.certifications)}</ul>`, c.accent) : ''}
      </div>
    </div>`;
  },

  /* ---- TECH MAHINDRA: Red bold ---- */
  techmahindra(c, d) {
    return `<div class="rv rv-techmahindra" style="--acc:${c.accent}">
      <div class="rv-tm-header">
        <div class="rv-tm-accent-top" style="background:${c.accent}"></div>
        <div class="rv-tm-content">
          <img src="/assets/logos/${c.logo}" alt="Tech Mahindra" style="height:36px;object-fit:contain" onerror="this.style.display='none'"/>
          <div>
            <h1 class="rv-name">${d.name}</h1>
            <p class="rv-title" style="color:${c.accent}">${d.title}</p>
            <p class="rv-contact">${contactLine(d)}</p>
          </div>
        </div>
      </div>
      <div class="rv-body rv-body-pad">
        ${sec('Summary', `<p>${d.summary}</p>`, c.accent)}
        ${sec('Experience', fmtExperience(d.experience), c.accent)}
        ${sec('Education', fmtEducation(d.education), c.accent)}
        ${d.skills ? sec('Skills', `<div class="rv-skills-wrap">${fmtSkills(d.skills)}</div>`, c.accent) : ''}
        ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        ${d.certifications ? sec('Certifications', `<ul class="rv-list">${fmtCerts(d.certifications)}</ul>`, c.accent) : ''}
      </div>
    </div>`;
  },

  /* ---- MINDTREE: Clean blue-green ---- */
  mindtree(c, d) { return TEMPLATE_RENDERERS.default(c, d); },

  /* ---- ZOHO: Modern SaaS, red accent ---- */
  zoho(c, d) {
    return `<div class="rv rv-zoho" style="--acc:${c.accent}">
      <div class="rv-zoho-header">
        <img src="/assets/logos/${c.logo}" alt="Zoho" style="height:32px;object-fit:contain;margin-bottom:8px" onerror="this.style.display='none'"/>
        <div class="rv-zoho-divider" style="background:${c.accent}"></div>
        <div class="rv-zoho-name">
          <h1 class="rv-name">${d.name}</h1>
          <p class="rv-title" style="color:${c.accent}">${d.title}</p>
          <p class="rv-contact">${contactLine(d)}</p>
        </div>
      </div>
      <div class="rv-zoho-body">
        <div class="rv-zoho-main">
          ${sec('About Me', `<p>${d.summary}</p>`, c.accent)}
          ${sec('Experience', fmtExperience(d.experience), c.accent)}
          ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        </div>
        <div class="rv-zoho-aside">
          ${d.skills ? `<div class="rv-sidebar-sec"><div class="rv-sidebar-title" style="background:${c.accent}">Skills</div><div class="rv-skills-wrap rv-skills-col">${fmtSkills(d.skills)}</div></div>` : ''}
          ${sec('Education', fmtEducation(d.education), c.accent)}
          ${d.certifications ? `<div class="rv-sidebar-sec"><div class="rv-sidebar-title" style="background:${c.accent}">Certifications</div><ul class="rv-list">${fmtCerts(d.certifications)}</ul></div>` : ''}
        </div>
      </div>
    </div>`;
  },

  /* ---- FRESHWORKS: Green, modern SaaS ---- */
  freshworks(c, d) {
    return `<div class="rv rv-freshworks" style="--acc:${c.accent};--acc2:${c.accent2}">
      <div class="rv-fw-header" style="background:${c.accent2}">
        <div>
          <h1 class="rv-name rv-name-light">${d.name}</h1>
          <p class="rv-title-light" style="color:${c.accent}">${d.title}</p>
          <p class="rv-contact rv-contact-light">${contactLine(d)}</p>
        </div>
        <img src="/assets/logos/${c.logo}" alt="Freshworks" class="rv-header-logo rv-header-logo-light" onerror="this.style.display='none'"/>
      </div>
      <div class="rv-fw-accent-bar" style="background:linear-gradient(90deg,${c.accent},${c.accent3})"></div>
      <div class="rv-body rv-body-pad">
        ${sec('Summary', `<p>${d.summary}</p>`, c.accent)}
        ${sec('Experience', fmtExperience(d.experience), c.accent)}
        ${sec('Education', fmtEducation(d.education), c.accent)}
        ${d.skills ? sec('Skills', `<div class="rv-skills-wrap">${fmtSkills(d.skills)}</div>`, c.accent) : ''}
        ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        ${d.certifications ? sec('Certifications', `<ul class="rv-list">${fmtCerts(d.certifications)}</ul>`, c.accent) : ''}
      </div>
    </div>`;
  },

  /* ---- DEFAULT FALLBACK ---- */
  default(c, d) {
    return `<div class="rv rv-default" style="--acc:${c.accent}">
      <div class="rv-default-header" style="border-top:5px solid ${c.accent}">
        <div>
          <h1 class="rv-name">${d.name}</h1>
          <p class="rv-title" style="color:${c.accent}">${d.title}</p>
          <p class="rv-contact">${contactLine(d)}</p>
        </div>
        <img src="/assets/logos/${c.logo}" alt="${c.name}" class="rv-header-logo" onerror="this.style.display='none'"/>
      </div>
      <div class="rv-body rv-body-pad">
        ${sec('Summary', `<p>${d.summary}</p>`, c.accent)}
        ${sec('Experience', fmtExperience(d.experience), c.accent)}
        ${sec('Education', fmtEducation(d.education), c.accent)}
        ${d.skills ? sec('Skills', `<div class="rv-skills-wrap">${fmtSkills(d.skills)}</div>`, c.accent) : ''}
        ${d.projects ? sec('Projects', fmtProjects(d.projects), c.accent) : ''}
        ${d.certifications ? sec('Certifications', `<ul class="rv-list">${fmtCerts(d.certifications)}</ul>`, c.accent) : ''}
      </div>
    </div>`;
  }
};

/* ============================================================
   PDF DOWNLOAD
   ============================================================ */
function setupTmplDownload() {
  const btn = document.getElementById('tmplDownloadBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (!RESUME_DATA || !ACTIVE_COMPANY) { showToast('Please select a company template first.', 'error'); return; }
    const el = document.getElementById('tmplResumePreview');
    if (!el) return;

    btn.disabled = true;
    btn.textContent = 'Generating...';

    try {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${RESUME_DATA.name.replace(/\s+/g,'_')}_${ACTIVE_COMPANY.name}_Resume.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(el).save();
      showToast('Resume downloaded!', 'success');
    } catch(e) {
      showToast('PDF generation failed: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> Download PDF`;
    }
  });
}

/* ============================================================
   SERVER-SIDE PARSE ENDPOINT ADDITION (call from server.js)
   NOTE: Add this route to server.js:
   app.post('/api/parse-resume', upload.single('resume'), async (req,res) => {
     try {
       const text = await extractText(req.file.buffer, req.file.mimetype);
       res.json({ text });
     } catch(e) { res.status(500).json({ error: e.message }); }
   });
   ============================================================ */

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  setupTmplUpload();
  setupEditPanel();
  renderCompanyGrid();
  setupTmplDownload();
});
