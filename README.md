# ResumeIQ — AI Resume Analyzer

> Developed by **Kethan** · No AI APIs · Pure Logic Intelligence

## 🚀 Deploy to Vercel (Free)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your repo
3. Leave all settings **default**
4. Click **Deploy** ✅

## 🌐 Live Features

- **Student Mode** — Resume score, skill match %, JD similarity, improvement tips
- **HR Mode** — Candidate screening + AI-generated interview questions  
- **Templates** — 18 IT company branded resume generator (Google, Amazon, TCS, Infosys etc.)

## 📁 Project Structure

```
resumeiq/
├── index.html          # Main app UI
├── style.css           # Styles
├── script.js           # Student + HR logic
├── templates.js        # IT company resume builder
├── assets/logos/       # 18 company logos (PNG)
├── api/
│   ├── _lib.js         # Shared: fuzzy matching, skill extraction, scoring
│   ├── analyze-student.js   # POST /api/analyze/student
│   ├── analyze-hr.js        # POST /api/analyze/hr
│   └── parse-resume.js      # POST /api/parse-resume
├── vercel.json         # Vercel routing config
└── package.json        # Dependencies: busboy, pdf-parse
```

## 🛠 Local Development

```bash
npm install -g vercel
npm install
vercel dev
```

Open http://localhost:3000
