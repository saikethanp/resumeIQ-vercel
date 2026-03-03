/**
 * ResumeIQ — Shared API Logic
 * Developed by Kethan
 */

let pdfParse;
try { pdfParse = require('pdf-parse'); } catch(e) {}

/* ── SKILLS DATABASE (inline — no fs needed on Vercel) ── */
const skillsDB = {
  languages: ['python','javascript','typescript','java','c++','c#','go','rust','swift','kotlin','r','scala','php','ruby','dart','bash','shell','matlab','sql','html','css'],
  ml_frameworks: ['tensorflow','pytorch','keras','scikit-learn','xgboost','lightgbm','catboost','hugging face','transformers','onnx','mlflow','optuna','ray','jax','paddlepaddle'],
  machine_learning: ['machine learning','deep learning','neural networks','nlp','natural language processing','computer vision','reinforcement learning','generative ai','llm','large language model','fine-tuning','rag','retrieval augmented generation','transfer learning','federated learning','gans','diffusion models','object detection','image classification','sentiment analysis','text classification','named entity recognition','question answering','summarization','embeddings','vector database','feature engineering','hyperparameter tuning','cross-validation','a/b testing','statistical modeling','bayesian inference','time series','anomaly detection'],
  data_tools: ['pandas','numpy','matplotlib','seaborn','plotly','scipy','statsmodels','dask','polars','pyspark','apache spark','hadoop','hive','presto','airflow','dbt','great expectations','feast','tableau','power bi','looker','metabase','superset','jupyter','databricks','snowflake','bigquery','redshift','kafka','flink','beam'],
  cloud: ['aws','azure','gcp','google cloud','amazon web services','ec2','s3','lambda','rds','ecs','eks','fargate','sagemaker','azure ml','vertex ai','cloudformation','terraform','pulumi','cdk','iam','vpc','cloudwatch','azure devops','gke','cloud run','cloud functions','firebase','amplify','heroku','railway','vercel','netlify'],
  devops: ['docker','kubernetes','jenkins','github actions','gitlab ci','ci/cd','ansible','chef','puppet','helm','istio','prometheus','grafana','datadog','elk stack','linux','bash','nginx','apache','load balancing','service mesh','argocd','spinnaker','terraform','vagrant','packer'],
  databases: ['postgresql','mysql','mongodb','redis','sqlite','elasticsearch','cassandra','dynamodb','neo4j','influxdb','cockroachdb','mariadb','oracle db','mssql','supabase','planetscale','fauna','couchdb','hbase','clickhouse','pinecone','weaviate','chroma','qdrant','milvus','pgvector'],
  web_frameworks: ['react','nextjs','vue','angular','svelte','nodejs','express','fastapi','flask','django','spring boot','laravel','rails','nestjs','nuxt','remix','astro','solid','qwik','hono','graphql','rest api','grpc','websocket','trpc'],
  mobile: ['react native','flutter','android','ios','swift','kotlin','jetpack compose','swiftui','expo','ionic','cordova','xamarin'],
  tools: ['git','github','gitlab','bitbucket','jira','confluence','postman','swagger','figma','vscode','intellij','vim','linux','windows','macos','agile','scrum','kanban','tdd','bdd','microservices','monorepo','nx','turborepo','webpack','vite','babel','eslint','prettier'],
  security: ['oauth','jwt','ssl','tls','encryption','authentication','authorization','owasp','penetration testing','cybersecurity','sso','saml','ldap','vault','secrets management'],
  soft_skills: ['problem solving','system design','leadership','communication','teamwork','mentoring','code review','technical writing','architecture','scalability'],
};

const ALL_SKILLS = [];
Object.entries(skillsDB).forEach(([cat, skills]) => {
  skills.forEach(s => ALL_SKILLS.push({ skill: s.toLowerCase(), category: cat }));
});

/* ── QUESTIONS DATABASE (inline) ── */
const questionsDB = {
  python: ['Explain Python\'s GIL and its impact on multithreading.','What are Python decorators and how do you implement them?','How does Python manage memory? Explain garbage collection.','What is the difference between `__init__` and `__new__`?'],
  javascript: ['Explain the event loop and asynchronous programming in JavaScript.','What is the difference between `var`, `let`, and `const`?','How does prototypal inheritance work in JavaScript?','Explain closures with a practical example.'],
  typescript: ['What are generics in TypeScript and when would you use them?','Explain the difference between `interface` and `type` in TypeScript.','How do you handle null safety in TypeScript?'],
  java: ['Explain the difference between JDK, JRE, and JVM.','What are Java Streams and how do they differ from Collections?','Explain SOLID principles with Java examples.'],
  react: ['What is the virtual DOM and how does React use it?','Explain React hooks — useEffect, useState, useContext.','How do you optimize React performance? (memo, useMemo, useCallback)','What is the difference between controlled and uncontrolled components?'],
  nodejs: ['How does Node.js handle concurrency with a single thread?','What is the difference between `process.nextTick`, `setImmediate`, and `setTimeout`?','Explain streams in Node.js and when to use them.'],
  machine_learning: ['Explain overfitting vs underfitting and how to address each.','What is the bias-variance tradeoff?','How do you handle class imbalance in a dataset?','Explain gradient descent and its variants (SGD, Adam, RMSProp).'],
  deep_learning: ['Explain backpropagation step by step.','What is the vanishing gradient problem and how is it solved?','Compare CNNs, RNNs, and Transformers.'],
  nlp: ['What is the attention mechanism and why was it revolutionary?','Explain BERT vs GPT architecture differences.','How do you evaluate NLP model performance?'],
  sql: ['What is the difference between INNER, LEFT, RIGHT, and FULL JOIN?','Explain database normalization (1NF, 2NF, 3NF).','How do you optimize slow SQL queries?','What are window functions? Give examples.'],
  docker: ['What is the difference between a Docker image and container?','Explain Docker networking modes.','How do you reduce Docker image size?'],
  kubernetes: ['What is a Pod vs Deployment vs Service in Kubernetes?','How does Kubernetes handle self-healing?','Explain horizontal pod autoscaling.'],
  aws: ['Explain the difference between EC2, ECS, EKS, and Lambda.','What is the difference between S3 Standard, IA, and Glacier?','How do you design a highly available AWS architecture?'],
  system_design: ['How would you design a URL shortener like bit.ly?','How do you handle database sharding?','Explain CAP theorem with real examples.','How would you design a real-time messaging system?'],
  general: ['Describe a challenging technical project and how you overcame obstacles.','How do you stay updated with emerging technologies?','Explain a time you significantly optimized system performance.','How do you approach debugging a critical production issue?','Describe your approach to learning a completely new technology quickly.'],
};

/* ── ROLE EXPANDER ── */
const ROLE_EXPANSIONS = {
  'ml engineer':'machine learning python pytorch tensorflow scikit-learn deep learning feature engineering mlflow docker kubernetes sql pandas numpy',
  'machine learning engineer':'machine learning python pytorch tensorflow scikit-learn deep learning mlflow docker sql pandas numpy',
  'ai engineer':'machine learning deep learning python pytorch tensorflow nlp computer vision llm generative ai transformers model deployment docker',
  'data scientist':'python r statistics machine learning pandas numpy matplotlib sql data analysis hypothesis testing feature engineering scikit-learn tableau',
  'data analyst':'sql python pandas excel tableau power bi data visualization statistics data analysis reporting dashboards mysql postgresql',
  'data engineer':'python sql spark hadoop kafka airflow dbt etl postgresql mysql mongodb aws gcp data pipeline bigquery',
  'deep learning engineer':'deep learning pytorch tensorflow keras cnn rnn lstm transformer backpropagation gpu cuda python computer vision nlp',
  'nlp engineer':'nlp natural language processing python pytorch tensorflow hugging face transformers bert gpt tokenization text classification sentiment analysis',
  'computer vision engineer':'computer vision opencv python pytorch tensorflow cnn yolo object detection image classification deep learning cuda',
  'llm engineer':'llm large language model python pytorch hugging face transformers fine-tuning rag langchain prompt engineering vector database',
  'software engineer':'python javascript java algorithms data structures system design databases rest api git docker agile sql backend microservices',
  'backend engineer':'nodejs python java spring rest api postgresql mysql mongodb redis docker kubernetes microservices git ci/cd express fastapi',
  'backend developer':'nodejs python java spring rest api postgresql mysql mongodb redis docker kubernetes microservices git express',
  'fullstack engineer':'react nodejs javascript typescript html css postgresql mongodb rest api docker git redux express tailwind',
  'fullstack developer':'react nodejs javascript typescript html css postgresql mongodb rest api docker git redux',
  'frontend engineer':'react javascript typescript html css redux webpack vite responsive design accessibility git tailwind',
  'frontend developer':'react javascript typescript html css redux webpack vite responsive design git tailwind',
  'web developer':'html css javascript react nodejs rest api sql git docker responsive design',
  'devops engineer':'docker kubernetes jenkins github actions terraform ansible aws gcp ci/cd linux bash prometheus grafana helm',
  'cloud engineer':'aws azure gcp terraform kubernetes docker networking security iam s3 ec2 lambda rds',
  'security engineer':'cybersecurity owasp penetration testing encryption authentication authorization ssl tls jwt oauth vulnerability assessment python linux',
  'android developer':'android java kotlin jetpack compose mvvm retrofit room sqlite firebase android studio git',
  'ios developer':'swift xcode ios swiftui uikit rest api sqlite firebase git',
  'mobile developer':'react native flutter dart ios android javascript typescript firebase git',
  'qa engineer':'testing selenium cypress jest pytest unit testing integration testing tdd bdd api testing postman automation',
  'software developer':'python javascript algorithms data structures rest api sql git docker agile',
};

function expandJobInput(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return 'software engineer python javascript problem solving';
  if (trimmed.split(/\s+/).length > 8) return trimmed;
  const lower = trimmed.toLowerCase();
  for (const [role, exp] of Object.entries(ROLE_EXPANSIONS)) {
    if (lower.includes(role) || role.includes(lower)) return `${trimmed} ${exp}`;
  }
  const words = lower.split(/\s+/);
  for (const [role, exp] of Object.entries(ROLE_EXPANSIONS)) {
    if (words.some(w => w.length > 3 && role.includes(w))) return `${trimmed} ${exp}`;
  }
  return trimmed;
}

/* ── FUZZY MATCHING ── */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}
function fuzzyMatch(a, b) {
  if (a===b) return true;
  const mx = Math.max(a.length,b.length);
  if (mx<=3) return a===b;
  return levenshtein(a,b) <= (mx<=5?1:mx<=9?2:3);
}
function skillInText(skill, words) {
  const sw = skill.toLowerCase().split(/\s+/);
  if (sw.length===1) return words.some(w=>fuzzyMatch(w,sw[0]));
  for (let i=0;i<=words.length-sw.length;i++)
    if (sw.every((s,j)=>fuzzyMatch(words[i+j],s))) return true;
  return false;
}

/* ── TOKENIZER ── */
const STOPWORDS = new Set(['a','an','the','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','not','no','i','my','we','our','you','your','he','she','it','they','their','this','these','those','what','how','why','all','any','some','very','also','about','experience','required','candidate','must','able','work','team','strong','good','role','position','looking','years','year']);
function tokenize(text) {
  return text.toLowerCase().replace(/[^\w\s+#.]/g,' ').split(/\s+/).filter(w=>w.length>1&&!STOPWORDS.has(w));
}

/* ── TEXT EXTRACTION ── */
async function extractText(buffer, mimetype) {
  if ((mimetype==='application/pdf'||mimetype==='application/octet-stream') && pdfParse) {
    try { return (await pdfParse(buffer)).text || ''; } catch(e) {}
  }
  return buffer.toString('utf8');
}

/* ── SKILL EXTRACTION ── */
function extractSkills(text) {
  const words = tokenize(text);
  const found = new Map();
  ALL_SKILLS.forEach(({ skill, category }) => {
    if (!found.has(skill) && skillInText(skill, words)) found.set(skill, category);
  });
  return Array.from(found.entries()).map(([skill, category]) => ({ skill, category }));
}

/* ── TF-IDF SIMILARITY ── */
function tfidfSimilarity(t1, t2) {
  const w1=tokenize(t1), w2=tokenize(t2);
  if (!w1.length||!w2.length) return 0;
  const all=new Set([...w1,...w2]);
  const tf=(words,word)=>words.filter(w=>w===word).length/words.length;
  const vec=words=>{const v={};all.forEach(word=>{const df=(w1.includes(word)?1:0)+(w2.includes(word)?1:0);v[word]=tf(words,word)*Math.log(3/(1+df));});return v;};
  const v1=vec(w1),v2=vec(w2);
  let dot=0,m1=0,m2=0;
  all.forEach(w=>{dot+=(v1[w]||0)*(v2[w]||0);m1+=(v1[w]||0)**2;m2+=(v2[w]||0)**2;});
  return Math.round((m1&&m2?dot/(Math.sqrt(m1)*Math.sqrt(m2)):0)*100);
}

/* ── SCORING ── */
function calculateScore(skillMatch, tfidf, totalWords) {
  const depth=Math.min(100,(totalWords/350)*100);
  return Math.round(Math.min(99,Math.max(1,skillMatch*0.5+tfidf*0.3+depth*0.2)));
}

/* ── SUGGESTIONS ── */
function generateSuggestions(matched, missing, score) {
  const cats=[...new Set(missing.map(s=>s.category))];
  const s=[];
  if(score<30) s.push('Resume needs significant improvement. Focus on core required skills first.');
  else if(score<55) s.push('Solid foundation — bridge the gaps with targeted projects and certifications.');
  else if(score<75) s.push('Strong profile! A few targeted additions will make you a top candidate.');
  else s.push('Excellent match! Highlight your most relevant experience prominently.');
  if(cats.includes('machine_learning')||cats.includes('ml_frameworks')) s.push('Add ML projects with quantified results (e.g., "Achieved 94% F1-score on custom dataset").');
  if(cats.includes('cloud')) s.push('Cloud certifications (AWS/GCP/Azure) will significantly strengthen your profile.');
  if(cats.includes('devops')) s.push('Containerize a project with Docker + Kubernetes to demonstrate DevOps skills.');
  if(missing.length>4) s.push(`Key skills to add: ${missing.slice(0,4).map(x=>x.skill).join(', ')}.`);
  s.push('Quantify every achievement — numbers make your resume 40% more impactful.');
  s.push('Mirror keywords from the job description to pass ATS filters.');
  s.push('Use the STAR method (Situation, Task, Action, Result) to frame achievements.');
  return s.slice(0,6);
}

/* ── INTERVIEW QUESTIONS ── */
function generateInterviewQuestions(skills) {
  const questions=[],used=new Set();
  const names=skills.map(s=>s.skill);
  const matched=Object.keys(questionsDB).filter(k=>names.includes(k));
  const rest=Object.keys(questionsDB).filter(k=>!matched.includes(k));
  for(const key of [...matched,...rest]){
    if(questions.length>=10) break;
    if(questionsDB[key]&&!used.has(key)){
      const qs=questionsDB[key];
      questions.push({skill:key,question:qs[Math.floor(Math.random()*qs.length)]});
      used.add(key);
    }
  }
  const gen=questionsDB.general;
  while(questions.length<10) questions.push({skill:'general',question:gen[questions.length%gen.length]});
  return questions.slice(0,10);
}

/* ── MULTIPART PARSER (replaces multer for Vercel) ── */
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const Busboy = require('busboy');
    const bb = Busboy({ headers: req.headers, limits: { fileSize: 10*1024*1024 } });
    const fields = {};
    let fileBuffer = null;
    let fileMime = 'text/plain';
    let fileName = '';

    bb.on('file', (name, stream, info) => {
      fileMime = info.mimeType || 'text/plain';
      fileName = info.filename || '';
      const chunks = [];
      stream.on('data', d => chunks.push(d));
      stream.on('end', () => { fileBuffer = Buffer.concat(chunks); });
      stream.on('error', reject);
    });
    bb.on('field', (name, val) => { fields[name] = val; });
    bb.on('finish', () => resolve({ fields, fileBuffer, fileMime, fileName }));
    bb.on('error', reject);
    req.pipe(bb);
  });
}

module.exports = {
  extractText,
  extractSkills,
  tfidfSimilarity,
  calculateScore,
  generateSuggestions,
  generateInterviewQuestions,
  expandJobInput,
  tokenize,
  parseMultipart,
};
