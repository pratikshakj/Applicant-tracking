import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import JobSeekerDashboard from './JobSeekerDashboard.jsx';
import { EMPLOYMENT_TYPES, JOB_DEPARTMENTS } from './jobOptions.js';
import {
  ArrowDownRight, ArrowRight, Award, BarChart3, BriefcaseBusiness, Building2, CalendarDays, Check,
  ChevronDown, CircleHelp, Eye, FileText, Globe, LayoutDashboard, LogOut, Mail, MapPin, Menu, Plus,
  Search, Settings2, ShoppingCart, Sparkles, Target, Trash2, TrendingUp, UserRound, Users, X,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || '';
function interviewCartKey(userId) { return `ats_interview_cart_${userId}`; }
function readInterviewCart(userId) {
  try { return JSON.parse(localStorage.getItem(interviewCartKey(userId)) || '[]'); }
  catch { return []; }
}
function writeInterviewCart(userId, applicationIds) {
  localStorage.setItem(interviewCartKey(userId), JSON.stringify(applicationIds));
  window.dispatchEvent(new CustomEvent('interview-cart-updated', { detail: { userId } }));
}

async function api(path, options = {}) {
  const token = sessionStorage.getItem('ats_token');
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const validation = data.errors ? Object.values(data.errors).flat().join(' ') : '';
    throw new Error(validation || data.message || `Request failed (${response.status})`);
  }
  return data;
}

function useAuth() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(() => Boolean(sessionStorage.getItem('ats_token')));
  useEffect(() => {
    if (!sessionStorage.getItem('ats_token')) return;
    api('/me').then((result) => {
      setUser(result.user);
      sessionStorage.setItem('ats_user', JSON.stringify(result.user));
    }).catch(() => {
      sessionStorage.removeItem('ats_token');
      sessionStorage.removeItem('ats_user');
    }).finally(() => setChecking(false));
  }, []);
  const signIn = (payload) => {
    sessionStorage.setItem('ats_token', payload.token);
    sessionStorage.setItem('ats_user', JSON.stringify(payload.user));
    setUser(payload.user);
    setChecking(false);
  };
  const signOut = async () => {
    try { await api('/logout', { method: 'POST' }); } catch { /* Local sign-out still succeeds. */ }
    sessionStorage.removeItem('ats_token');
    sessionStorage.removeItem('ats_user');
    setUser(null);
  };
  return { user, checking, signIn, signOut };
}

function Brand({ inverse = false }) {
  return <Link className={`brand ${inverse ? 'brand-inverse' : ''}`} to="/">
    <span className="brand-mark"><Sparkles size={17} strokeWidth={2.5} /></span>
    <span>Hire<span className="brand-light">Flow</span></span>
  </Link>;
}

function PublicNav() {
  return <header className="public-nav wrap">
    <Brand />
    <nav className="public-links"><a href="#top">Home</a><a href="#capabilities">Jobs</a><a href="#workflow">About</a></nav>
    <div className="nav-actions"><Link className="text-link" to="/user/auth">Job seeker sign in</Link><Link className="button button-dark button-small" to="/recruiter/auth">Recruiter sign in <ArrowRight size={15} /></Link></div>
  </header>;
}

function Home() {
  const [contactOpen, setContactOpen] = useState(false);
  return <div className="landing">
    <PublicNav />
    <main id="top">
      <section className="hero wrap">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> AWS-BASED JOB RECRUITMENT AND APPLICANT TRACKING SYSTEM</span>
          <h1>Find your place<br />in the <em>hiring story.</em></h1>
          <p className="hero-intro">A shared platform with dedicated spaces for the people hiring and the people looking for their next opportunity.</p>
          <div className="role-choice-grid">
            <article className="role-choice role-choice-recruiter"><span className="role-choice-icon"><BriefcaseBusiness size={20} /></span><span className="role-choice-label">FOR TEAMS</span><h2>Recruiter</h2><p>Find talented candidates, publish job openings, and manage applications.</p><Link className="button button-dark" to="/recruiter/auth">Continue as Recruiter <ArrowRight size={15} /></Link></article>
            <article className="role-choice role-choice-seeker"><span className="role-choice-icon"><UserRound size={20} /></span><span className="role-choice-label">FOR INDIVIDUALS</span><h2>Job Seeker</h2><p>Discover open opportunities and keep your job search moving.</p><Link className="button button-light" to="/user/auth">Continue as Job Seeker <ArrowRight size={15} /></Link></article>
          </div>
          <div className="hero-proof"><span className="proof-icon"><Check size={14} /></span><span>Choose the workspace that fits you. Your account role is verified by the backend.</span></div>
        </div>
        <div className="hero-art" aria-label="Preview of the recruiter workspace">
          <div className="art-topline"><span>YOUR RECRUITER WORKSPACE</span><span className="live-mark"><i /> READY WHEN YOU ARE</span></div>
          <div className="art-heading"><div><span className="art-kicker">ROLE MANAGEMENT</span><h2>Your next opening</h2><p>Start with a role brief, then add resumes.</p></div><span className="art-window">WORKSPACE</span></div>
          <div className="art-divider" />
          <div className="art-preview"><span className="art-preview-icon"><FileText size={22} /></span><div><span className="art-kicker">RESUME INSIGHTS</span><h3>Evidence, when it’s ready.</h3><p>Extracted details and match scores appear after processing a real resume.</p></div></div>
          <div className="art-preview-tags"><span><Check size={12} /> Parsed skills</span><span><Check size={12} /> Role comparison</span></div>
          <div className="art-footer"><span><span className="avatar-dot"><BriefcaseBusiness size={11} /></span> Your open roles</span><span><Sparkles size={14} /> AI-assisted review</span></div>
          <span className="art-stamp">REAL<br />DATA<br />ONLY</span>
        </div>
      </section>
      <section className="signal-strip"><div className="wrap signal-inner"><span>BUILT FOR THE HUMAN SIDE OF HIRING</span><span>Roles <b>↗</b> Resumes <b>↗</b> Evidence <b>↗</b> Decisions</span><span className="strip-end">A clearer shortlist starts here.</span></div></section>
      <section className="capabilities wrap" id="capabilities">
        <div className="section-heading"><div><span className="eyebrow">A BETTER REVIEW LOOP</span><h2>Less tab-hopping.<br /><em>More useful context.</em></h2></div><p>Keep the hiring essentials together, from defining the role to understanding what a resume actually shows.</p></div>
        <div className="capability-grid">
          <article className="capability"><span className="cap-icon coral"><BriefcaseBusiness size={20} /></span><span className="cap-number">01 / DEFINE</span><h3>Shape the role</h3><p>Create and manage openings with clear requirements, skills, and status.</p></article>
          <article className="capability"><span className="cap-icon green"><FileText size={20} /></span><span className="cap-number">02 / REVIEW</span><h3>Read the resume</h3><p>Upload PDF or Word resumes and review extracted candidate details in one place.</p></article>
          <article className="capability"><span className="cap-icon yellow"><Target size={20} /></span><span className="cap-number">03 / COMPARE</span><h3>Understand the match</h3><p>See actual skill overlap and matching scores returned by the connected service.</p></article>
        </div>
      </section>
      <section className="workflow" id="workflow"><div className="wrap workflow-inner"><span className="eyebrow">A WORKFLOW THAT STAYS GROUNDED</span><h2>From role brief to<br /><em>better-informed review.</em></h2><div className="workflow-steps"><div><span>01</span><p>Create a role</p></div><ArrowRight size={16} /><div><span>02</span><p>Add a resume</p></div><ArrowRight size={16} /><div><span>03</span><p>Review the evidence</p></div></div><Link className="button button-light" to="/register">Get started <ArrowRight size={16} /></Link></div></section>
    </main>
    <footer className="public-footer wrap"><Brand /><span>AI can inform a review. People make the decision.</span><button className="contact-trigger" onClick={() => setContactOpen(true)}>Contact <ArrowRight size={14} /></button></footer>
    {contactOpen && <ContactDialog onClose={() => setContactOpen(false)} />}
  </div>;
}

function ContactDialog({ onClose }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [copied, setCopied] = useState(false);
  const emailBody = `Name: ${form.name}\nReply email: ${form.email}\n\n${form.message}`;
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(form.subject || 'HireFlow enquiry')}&body=${encodeURIComponent(emailBody)}`;
  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(`To: ${CONTACT_EMAIL || '[configure VITE_CONTACT_EMAIL]'}\nSubject: ${form.subject || 'HireFlow enquiry'}\n\n${emailBody}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title"><div className="modal-heading"><div><span className="eyebrow">GET IN TOUCH</span><h2 id="contact-modal-title">Contact the team</h2></div><button className="icon-button" onClick={onClose} aria-label="Close contact form"><X size={19} /></button></div>
    {!CONTACT_EMAIL && <Notice error>Contact email is not configured. Set a real inbox in <code>frontend/.env</code> as <code>VITE_CONTACT_EMAIL</code>.</Notice>}
    <form onSubmit={(event) => { event.preventDefault(); window.location.href = mailto; }}><label>Your name<input required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Your email<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Subject<input required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></label><label>Message<textarea required rows="4" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></label><p className="contact-help">This opens your default email app with the message prepared. The site does not send or store contact messages.</p><div className="modal-actions"><button type="button" className="button button-quiet" onClick={copyMessage}>{copied ? 'Copied' : 'Copy message'}</button><button type="submit" className="button button-dark" disabled={!CONTACT_EMAIL}>Open email app <ArrowRight size={15} /></button></div></form>
  </section></div>;
}

function AuthPage({ mode, accountType, onSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', company_name: '', email: '', password: '', password_confirmation: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const register = mode === 'register';
  const recruiter = accountType === 'recruiter';
  const title = recruiter ? 'Recruiter' : 'Job Seeker';
  const loginPath = recruiter ? '/recruiter/auth' : '/user/auth';
  const registerPath = recruiter ? '/recruiter/register' : '/user/register';
  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (register && form.password !== form.password_confirmation) { setError('Passwords do not match.'); return; }
    setPending(true);
    try {
      const endpoint = register
        ? (recruiter ? '/recruiter/register' : '/user/register')
        : (recruiter ? '/recruiter/login' : '/user/login');
      const result = await api(endpoint, { method: 'POST', body: JSON.stringify(form) });
      const userIsJobSeeker = ['job_seeker', 'candidate'].includes(result.user?.role);
      if (userIsJobSeeker === recruiter) throw new Error(`This account is not registered as a ${title.toLowerCase()}. Use the other sign-in option.`);
      onSuccess(result);
      navigate(userIsJobSeeker ? '/user/dashboard' : '/workspace/overview');
    } catch (requestError) { setError(requestError.message); }
    finally { setPending(false); }
  };
  return <main className={`auth-page auth-${recruiter ? 'recruiter' : 'seeker'}`}><div className="auth-side"><Brand inverse /><div className="auth-side-copy"><span className="eyebrow">{recruiter ? 'RECRUITER WORKSPACE' : 'JOB SEEKER SPACE'}</span><h1>{recruiter ? 'Build a stronger team.' : 'Find your next opportunity.'}</h1><p>{recruiter ? 'Publish roles, review candidate resumes, and use matching insights in your hiring workflow.' : 'Explore open roles from recruiters and find opportunities that fit your next step.'}</p><div className="auth-side-note">{recruiter ? <BriefcaseBusiness size={15} /> : <UserRound size={15} />}{recruiter ? 'Your recruiter role is verified by the backend.' : 'Your job seeker account stays separate from recruiter tools.'}</div></div><span className="auth-side-foot">RESUME AI <span>·</span> {title.toUpperCase()}</span></div>
    <div className="auth-content"><Link to="/" className="back-home">← Back to home</Link><form className="auth-form" onSubmit={submit}><span className="eyebrow">{register ? `CREATE ${title.toUpperCase()} ACCOUNT` : `${title.toUpperCase()} SIGN IN`}</span><h2>{register ? `Create your ${recruiter ? 'recruiter' : 'job seeker'} account` : `Sign in as ${recruiter ? 'recruiter' : 'job seeker'}`}</h2><p className="auth-subtitle">{register ? 'Your account role is assigned securely when it is created.' : `Use your ${recruiter ? 'recruiter' : 'job seeker'} credentials to continue.`}</p>
      {register && <><label>Full name<input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Alex Morgan" /></label>{recruiter && <label>Company name <span className="optional">OPTIONAL</span><input autoComplete="organization" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Company or team" /></label>}</>}
      <label>Work email<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" /></label>
      <label>Password<span className="password-field"><input required minLength={register ? 8 : undefined} type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={register ? 'At least 8 characters' : 'Your password'} /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'HIDE' : 'SHOW'}</button></span></label>
      {register && <label>Confirm password<span className="password-field"><input required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} placeholder="Re-enter your password" /></span></label>}
      {error && <div className="inline-error" role="alert">{error}</div>}<button className="button button-dark auth-submit" disabled={pending}>{pending ? 'Please wait…' : register ? `Create ${title} account` : `Login as ${title}`} <ArrowRight size={16} /></button>
      <p className="auth-switch">{register ? 'Already have an account?' : 'Need an account?'} <Link to={register ? loginPath : registerPath}>{register ? `Login as ${title}` : `Create ${title} account`}</Link></p>
      <p className="auth-switch auth-role-switch">Wrong section? <Link to={recruiter ? '/user/auth' : '/recruiter/auth'}>Continue as {recruiter ? 'Job Seeker' : 'Recruiter'}</Link></p>
    </form></div></main>;
}

function isJobSeeker(user) { return ['job_seeker', 'candidate'].includes(user?.role); }
function dashboardPath(user) { return isJobSeeker(user) ? '/user/dashboard' : '/workspace/overview'; }
function Protected({ user, role, children }) {
  if (!user) return <Navigate to={role === 'user' ? '/user/auth' : '/recruiter/auth'} replace />;
  if ((role === 'user') !== isJobSeeker(user)) return <Navigate to={dashboardPath(user)} replace />;
  return children;
}

function App() {
  const auth = useAuth();
  if (auth.checking) return <Loading label="Verifying your account" />;
  return <Routes>
    <Route path="/" element={auth.user ? <Navigate to={dashboardPath(auth.user)} replace /> : <Home />} />
    <Route path="/recruiter/auth" element={auth.user ? <Navigate to={dashboardPath(auth.user)} replace /> : <AuthPage mode="login" accountType="recruiter" onSuccess={auth.signIn} />} />
    <Route path="/recruiter/login" element={<Navigate to="/recruiter/auth" replace />} />
    <Route path="/recruiter/register" element={auth.user ? <Navigate to={dashboardPath(auth.user)} replace /> : <AuthPage mode="register" accountType="recruiter" onSuccess={auth.signIn} />} />
    <Route path="/user/auth" element={auth.user ? <Navigate to={dashboardPath(auth.user)} replace /> : <AuthPage mode="login" accountType="user" onSuccess={auth.signIn} />} />
    <Route path="/user/register" element={auth.user ? <Navigate to={dashboardPath(auth.user)} replace /> : <AuthPage mode="register" accountType="user" onSuccess={auth.signIn} />} />
    <Route path="/register" element={<Navigate to="/recruiter/register" replace />} />
    <Route path="/workspace/*" element={<Protected user={auth.user} role="recruiter"><Workspace user={auth.user} onSignOut={auth.signOut} /></Protected>} />
    <Route path="/recruiter/dashboard" element={<Navigate to="/workspace/overview" replace />} />
    <Route path="/user/dashboard" element={<Protected user={auth.user} role="user"><JobSeekerDashboard user={auth.user} onSignOut={auth.signOut} /></Protected>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

const sections = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'jobs', label: 'Job openings', icon: BriefcaseBusiness },
  { key: 'candidates', label: 'Candidates', icon: Users },
  { key: 'interviews', label: 'Interview invite', icon: Mail },
  { key: 'screening', label: 'AI screening', icon: Sparkles },
];

function Workspace({ user, onSignOut }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(() => readInterviewCart(user.id).length);
  useEffect(() => { const key = location.pathname.split('/')[2]; if (sections.some((section) => section.key === key)) setActive(key); else setActive('overview'); }, [location.pathname]);
  useEffect(() => {
    const update = (event) => {
      if (event.detail?.userId === user.id) setCartCount(readInterviewCart(user.id).length);
    };
    window.addEventListener('interview-cart-updated', update);
    return () => window.removeEventListener('interview-cart-updated', update);
  }, [user.id]);
  const go = (key) => { setActive(key); navigate(`/workspace/${key}`); setMobileOpen(false); };
  return <div className="workspace">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}><div className="sidebar-brand"><Brand /><button className="icon-button close-menu" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div><div className="workspace-label">WORKSPACE</div><nav className="side-nav">{sections.map(({ key, label, icon: Icon }) => <button key={key} className={`side-link ${active === key ? 'active' : ''}`} onClick={() => go(key)}><Icon size={17} />{label}{key === 'screening' && <span className="side-new">AI</span>}{key === 'interviews' && cartCount > 0 && <span className="side-new">{cartCount}</span>}</button>)}</nav><div className="sidebar-bottom"><button className="account-button" onClick={() => go('account')}><span className="user-avatar">{initials(user.name)}</span><span className="account-copy"><b>{user.name}</b><small>{user.company_name || 'Recruiter account'}</small></span><ChevronDown size={15} /></button></div></aside>
    <main className="workspace-main"><header className="workspace-top"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button><span className="breadcrumb">Hiring workspace <span>/</span> {sectionTitle(active)}</span><div className="top-actions"><span className="api-status"><i /> RECRUITER VIEW</span><button onClick={onSignOut} className="signout-button"><LogOut size={16} /><span>Sign out</span></button></div></header>
      <Routes><Route index element={<Navigate to="overview" replace />} /><Route path="overview" element={<Dashboard user={user} onNavigate={go} />} /><Route path="jobs" element={<Jobs />} /><Route path="candidates" element={<Candidates userId={user.id} />} /><Route path="interviews" element={<InterviewCart userId={user.id} />} /><Route path="screening" element={<Screening userId={user.id} />} /><Route path="account" element={<Account user={user} />} /><Route path="*" element={<Navigate to="overview" replace />} /></Routes>
    </main>
  </div>;
}

function sectionTitle(key) { return sections.find((section) => section.key === key)?.label || 'Account'; }
function initials(name = '') { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'RA'; }
function PageHeader({ eyebrow, title, description, action }) { return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>; }
function Loading({ label = 'Loading workspace data' }) { return <div className="loading-state"><span className="spinner" />{label}</div>; }
function Notice({ children, error = false }) { return <div className={`notice ${error ? 'notice-error' : ''}`} role={error ? 'alert' : 'status'}>{children}</div>; }
function EmptyState({ icon: Icon = FileText, title, copy, action }) { return <div className="empty-state"><span><Icon size={21} /></span><h3>{title}</h3><p>{copy}</p>{action}</div>; }

function Dashboard({ user, onNavigate }) {
  const [data, setData] = useState(null); const [jobs, setJobs] = useState([]); const [error, setError] = useState('');
  useEffect(() => { Promise.all([api('/dashboard/stats'), api('/jobs')]).then(([stats, jobData]) => { setData(stats); setJobs(jobData.jobs || []); }).catch((e) => setError(e.message)); }, []);
  return <div className="page-content"><PageHeader eyebrow="YOUR HIRING DESK" title={`Good ${greeting()}, ${user.name.split(' ')[0]}.`} description="A clear view of the roles and candidates moving through your workspace." action={<button className="button button-dark" onClick={() => onNavigate('jobs')}><Plus size={16} /> Add a job</button>} />
    {error && <Notice error>{error}</Notice>}{!data && !error ? <Loading /> : <>
      <section className="metric-grid"><Metric label="OPEN ROLES" value={jobs.filter((job) => job.status === 'open').length} detail={`${jobs.length} total roles`} icon={BriefcaseBusiness} tone="peach" /><Metric label="CANDIDATES" value={data?.stats?.total_candidates ?? 0} detail="Resumes in your workspace" icon={Users} tone="mint" /><Metric label="SHORTLISTED" value={data?.stats?.shortlisted ?? 0} detail="Flagged for review" icon={Sparkles} tone="lilac" /></section>
      <div className="overview-grid"><section className="panel roles-panel"><div className="panel-heading"><div><span className="eyebrow">ROLE ACTIVITY</span><h2>Your openings</h2></div><button className="panel-link" onClick={() => onNavigate('jobs')}>All roles <ArrowRight size={15} /></button></div>{jobs.length ? <div className="role-list">{jobs.slice(0, 5).map((job) => <div className="role-row" key={job.id}><span className="role-symbol"><BriefcaseBusiness size={17} /></span><div className="role-title"><b>{job.title}</b><small>{(job.required_skills_json || []).slice(0, 3).join(' · ') || 'Skills not specified'}</small></div><span className={`status-pill ${job.status === 'open' ? 'status-open' : 'status-closed'}`}>{job.status}</span><span className="role-count">{job.matches_count ?? 0} <small>matches</small></span></div>)}</div> : <EmptyState icon={BriefcaseBusiness} title="No openings yet" copy="Create your first role to begin reviewing candidates." action={<button className="text-action" onClick={() => onNavigate('jobs')}>Create a job <ArrowRight size={14} /></button>} />}</section>
      <section className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow">RECENT RESUMES</span><h2>Candidate activity</h2></div><button className="icon-button" onClick={() => onNavigate('candidates')} aria-label="View candidates"><ArrowRight size={17} /></button></div>{(data?.recent_activities || []).length ? <div className="activity-list">{data.recent_activities.slice(0, 5).map((candidate) => <div className="activity-row" key={candidate.id}><span className="user-avatar avatar-small">{initials(candidate.parsed_name || 'Candidate')}</span><span className="activity-copy"><b>{candidate.parsed_name || `Candidate #${candidate.id}`}</b><small>{candidate.status === 'done' ? 'Resume analyzed' : candidate.status}</small></span><span className="activity-score">{candidate.ai_match_percentage ? `${candidate.ai_match_percentage}%` : 'Analyzed'}</span></div>)}</div> : <EmptyState icon={FileText} title="No candidate activity" copy="Uploaded resumes and their actual processing results will appear here." />}</section></div>
      <RecruiterAnalyticsGraph analytics={data?.analytics} stats={data?.stats} />
      <section className="bottom-note"><span className="note-mark"><Sparkles size={17} /></span><span><b>AI matching is decision support.</b><small>Review extracted skills and resume context before making hiring decisions.</small></span><span className="note-actual">Scores from your configured service</span></section>
    </>}
  </div>;
}

function RecruiterAnalyticsGraph({ analytics, stats }) {
  const [periodType, setPeriodType] = useState('months');
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const dataList = (periodType === 'months' ? analytics?.months : analytics?.days) || [];
  const maxVal = Math.max(
    ...dataList.map((d) => Math.max(d.jobs_posted || 0, d.applications || 0, d.hired || 0)),
    5
  );

  const totalJobs = dataList.reduce((acc, d) => acc + (d.jobs_posted || 0), 0);
  const totalApps = dataList.reduce((acc, d) => acc + (d.applications || 0), 0);
  const totalHired = dataList.reduce((acc, d) => acc + (d.hired || 0), 0);

  return (
    <section className="panel analytics-panel">
      <div className="panel-heading analytics-heading">
        <div>
          <span className="eyebrow">HIRING & RECRUITING PULSE</span>
          <h2>Hiring & Job Posting Analytics</h2>
          <p className="analytics-subtitle">Compare job openings posted against candidate applications and interview clearances.</p>
        </div>
        <div className="analytics-controls">
          <div className="analytics-pill-group">
            <button
              type="button"
              className={`pill-btn ${periodType === 'months' ? 'active' : ''}`}
              onClick={() => setPeriodType('months')}
            >
              Last 6 Months
            </button>
            <button
              type="button"
              className={`pill-btn ${periodType === 'days' ? 'active' : ''}`}
              onClick={() => setPeriodType('days')}
            >
              Last 7 Days
            </button>
          </div>
        </div>
      </div>

      <div className="analytics-legend-bar">
        <div className="legend-items">
          <span className="legend-item"><i className="legend-dot dot-purple" /> <b>Jobs Posted</b></span>
          <span className="legend-item"><i className="legend-dot dot-blue" /> <b>Applications Received</b></span>
          <span className="legend-item"><i className="legend-dot dot-green" /> <b>Candidates Cleared / Hired</b></span>
        </div>
        <span className="legend-scale-hint">Scaled relative to max: {maxVal}</span>
      </div>

      <div className="chart-wrapper">
        <div className="chart-gridlines">
          {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
            <div key={ratio} className="gridline-row">
              <span className="gridline-val">{Math.round(maxVal * ratio)}</span>
              <div className="gridline-rule" />
            </div>
          ))}
        </div>

        <div className="chart-columns">
          {dataList.map((item, idx) => {
            const jobsH = Math.max(6, Math.round(((item.jobs_posted || 0) / maxVal) * 160));
            const appsH = Math.max(6, Math.round(((item.applications || 0) / maxVal) * 160));
            const hiredH = Math.max(6, Math.round(((item.hired || 0) / maxVal) * 160));
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className="chart-col-group"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {isHovered && (
                  <div className="chart-tooltip">
                    <span className="tooltip-title">{item.period}</span>
                    <div className="tooltip-row">
                      <span className="dot dot-purple" />
                      <span>Jobs Posted:</span>
                      <b>{item.jobs_posted || 0}</b>
                    </div>
                    <div className="tooltip-row">
                      <span className="dot dot-blue" />
                      <span>Applications:</span>
                      <b>{item.applications || 0}</b>
                    </div>
                    <div className="tooltip-row">
                      <span className="dot dot-green" />
                      <span>Hired / Cleared:</span>
                      <b>{item.hired || 0}</b>
                    </div>
                  </div>
                )}

                <div className="bars-container">
                  <div
                    className="chart-bar bar-purple"
                    style={{ height: `${jobsH}px` }}
                    title={`Jobs Posted: ${item.jobs_posted || 0}`}
                  >
                    {(item.jobs_posted || 0) > 0 && <span className="bar-val">{item.jobs_posted}</span>}
                  </div>
                  <div
                    className="chart-bar bar-blue"
                    style={{ height: `${appsH}px` }}
                    title={`Applications: ${item.applications || 0}`}
                  >
                    {(item.applications || 0) > 0 && <span className="bar-val">{item.applications}</span>}
                  </div>
                  <div
                    className="chart-bar bar-green"
                    style={{ height: `${hiredH}px` }}
                    title={`Hired: ${item.hired || 0}`}
                  >
                    {(item.hired || 0) > 0 && <span className="bar-val">{item.hired}</span>}
                  </div>
                </div>

                <span className="chart-col-label">{item.short}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="analytics-summary-cards">
        <div className="analytics-card">
          <span className="kpi-label">TOTAL JOBS POSTED</span>
          <strong>{totalJobs}</strong>
          <small>Openings published in period</small>
        </div>
        <div className="analytics-card">
          <span className="kpi-label">APPLICATIONS RECEIVED</span>
          <strong>{totalApps}</strong>
          <small>Candidate submissions received</small>
        </div>
        <div className="analytics-card">
          <span className="kpi-label">INTERVIEWS CLEARED</span>
          <strong style={{ color: '#059669' }}>{totalHired}</strong>
          <small>Offers extended & accepted</small>
        </div>
        <div className="analytics-card">
          <span className="kpi-label">TOTAL SHORTLISTED</span>
          <strong>{stats?.shortlisted ?? 0}</strong>
          <small>Active candidate pipeline</small>
        </div>
      </div>
    </section>
  );
}
function greeting() { const hour = new Date().getHours(); return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'; }
function Metric({ label, value, detail, icon: Icon, tone }) { return <article className="metric"><div className="metric-top"><span>{label}</span><i className={`metric-icon ${tone}`}><Icon size={17} /></i></div><strong>{value ?? '—'}</strong><small>{detail}</small></article>; }

function Jobs() {
  const [jobs, setJobs] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [department, setDepartment] = useState(''); const [modal, setModal] = useState(null); const [notice, setNotice] = useState('');
  const refresh = () => { setLoading(true); api('/jobs').then((result) => setJobs(result.jobs || [])).catch((e) => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(refresh, []);
  const visible = jobs.filter((job) => (!department || job.department === department) && `${job.title} ${job.department || ''} ${(job.required_skills_json || []).join(' ')} ${job.description}`.toLowerCase().includes(query.toLowerCase()));
  const remove = async (job) => { if (!window.confirm(`Delete “${job.title}”? This cannot be undone.`)) return; try { await api(`/jobs/${job.id}`, { method: 'DELETE' }); setNotice('Job deleted.'); refresh(); } catch (e) { setError(e.message); } };
  const save = async (form) => { await api(modal?.id ? `/jobs/${modal.id}` : '/jobs', { method: modal?.id ? 'PUT' : 'POST', body: JSON.stringify(form) }); setModal(null); setNotice(modal?.id ? 'Job updated.' : 'Job created.'); refresh(); };
  return <div className="page-content"><PageHeader eyebrow="ROLE MANAGEMENT" title="Job openings" description="Write clear briefs, keep requirements current, and manage your active roles." action={<button className="button button-dark" onClick={() => setModal({})}><Plus size={16} /> Create a job</button>} />
    <div className="toolbar"><label className="search-field"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search roles or skills" /></label><label className="filter-select"><BriefcaseBusiness size={15} /><select aria-label="Filter by department" value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">All departments</option>{JOB_DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><span className="result-count">{visible.length} {visible.length === 1 ? 'role' : 'roles'}</span></div>
    {notice && <Notice>{notice}</Notice>}{error && <Notice error>{error}</Notice>}{loading ? <Loading /> : visible.length ? <div className="job-list">{visible.map((job) => <article className="job-row" key={job.id}><span className="job-icon"><BriefcaseBusiness size={18} /></span><div className="job-main"><div className="job-title-line"><h2>{job.title}</h2><span className={`status-pill ${job.status === 'open' ? 'status-open' : 'status-closed'}`}>{job.status}</span></div><p>{job.department || 'Other'} · {job.employment_type || 'Full-time'} · {job.experience_requirements || 'Experience requirements not specified'}</p><div className="tag-list">{(job.required_skills_json || []).map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}</div><small className="job-match-count">{job.matches_count ?? 0} matched candidates</small></div><div className="job-actions"><button className="text-action" onClick={() => setModal(job)}>Edit</button><button className="text-action danger-action" onClick={() => remove(job)}>Delete</button></div></article>)}</div> : <EmptyState icon={BriefcaseBusiness} title={query || department ? 'No roles match those filters' : 'Start with your first opening'} copy={query || department ? 'Try another title, skill, or department.' : 'Create a role to start organizing your hiring workflow.'} action={!query && !department && <button className="button button-dark" onClick={() => setModal({})}><Plus size={16} /> Create a job</button>} />}
    {modal && <JobModal job={modal} onClose={() => setModal(null)} onSave={save} />}
  </div>;
}

function JobModal({ job, onClose, onSave }) {
  const [form, setForm] = useState({ title: job.title || '', description: job.description || '', department: job.department || 'Software Engineering', employment_type: job.employment_type || 'Full-time', skills: (job.required_skills_json || []).join(', '), experience_requirements: job.experience_requirements || '', status: job.status || 'open' });
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  const submit = async (event) => { event.preventDefault(); setPending(true); setError(''); try { await onSave({ title: form.title, description: form.description, department: form.department, employment_type: form.employment_type, required_skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean), experience_requirements: form.experience_requirements || null, status: form.status }); } catch (e) { setError(e.message); } finally { setPending(false); } };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="job-modal-title"><div className="modal-heading"><div><span className="eyebrow">ROLE DETAILS</span><h2 id="job-modal-title">{job.id ? 'Edit job opening' : 'Create job opening'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div><form onSubmit={submit}><label>Job title<input required maxLength={255} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Senior product designer" /></label><label>Department<select required value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}>{JOB_DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Employment type<select required value={form.employment_type} onChange={(event) => setForm({ ...form, employment_type: event.target.value })}>{EMPLOYMENT_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Job description<textarea required rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the role and responsibilities" /></label><label>Required skills <span className="field-hint">COMMA SEPARATED</span><input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Research, Figma, prototyping" /></label><label>Experience requirements<input value={form.experience_requirements} onChange={(e) => setForm({ ...form, experience_requirements: e.target.value })} placeholder="3+ years, product design" /></label><label>Listing status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="open">Open</option><option value="closed">Closed</option></select></label>{error && <Notice error>{error}</Notice>}<div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button disabled={pending} className="button button-dark">{pending ? 'Saving…' : 'Save role'} <ArrowRight size={15} /></button></div></form></section></div>;
}

function Candidates({ userId }) {
  const [candidates, setCandidates] = useState([]); const [meta, setMeta] = useState(null); const [jobs, setJobs] = useState([]); const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [jobId, setJobId] = useState(''); const [page, setPage] = useState(1); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [selected, setSelected] = useState(null);
  useEffect(() => { api('/jobs').then((result) => setJobs(result.jobs || [])).catch((e) => setError(e.message)); }, []);
  const refresh = () => { setLoading(true); setError(''); const params = new URLSearchParams({ per_page: '20', page: String(page) }); if (search) params.set('search', search); if (status) params.set('status', status); if (jobId) params.set('job_id', jobId); api(`/candidates?${params}`).then((result) => { setCandidates(result.data || []); setMeta(result); }).catch((e) => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(() => { const timer = setTimeout(refresh, 250); return () => clearTimeout(timer); }, [search, status, jobId, page]);
  const deleteCandidate = async (candidate, event) => {
    if (event) event.stopPropagation();
    if (!window.confirm(`Delete "${candidate.parsed_name || `Candidate #${candidate.id}`}"? This will permanently remove the candidate, their resume, and all associated applications and matches. This cannot be undone.`)) return;
    try {
      await api(`/candidates/${candidate.id}`, { method: 'DELETE' });
      setNotice('Candidate deleted successfully.');
      setSelected(null);
      refresh();
    } catch (e) { setError(e.message); }
  };
  return <div className="page-content"><PageHeader eyebrow="TALENT POOL" title="Candidates" description="Review parsed resume details and matching results tied to your workspace." />
    <div className="toolbar"><label className="search-field"><Search size={17} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or email" /></label><label className="filter-select"><Settings2 size={16} /><select value={jobId} onChange={(e) => { setJobId(e.target.value); setPage(1); }}><option value="">All job openings</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></label><label className="filter-select"><Settings2 size={16} /><select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All applicants</option><option value="applied">Applied</option><option value="shortlisted">Shortlisted</option><option value="interview">Interview</option><option value="cleared">Interview Cleared</option><option value="rejected">Rejected</option><option value="done">Resume analyzed</option><option value="parsing">Processing</option><option value="failed">Needs attention</option></select></label><span className="result-count">{meta?.total ?? candidates.length} candidates</span></div>
    {error && <Notice error>{error}</Notice>}{notice && <Notice>{notice}</Notice>}{loading ? <Loading /> : candidates.length ? <div className="candidate-table-wrap"><table className="candidate-table"><thead><tr><th>CANDIDATE</th><th>APPLIED ROLE</th><th>EXTRACTED SKILLS</th><th>STATUS</th><th>BEST MATCH</th><th /></tr></thead><tbody>{candidates.map((candidate) => { const application = candidate.applications?.[0]; const displayedStatus = application?.status || candidate.status; const match = candidate.matches?.find((item) => item.job_id === application?.job_id); return <tr key={candidate.id} onClick={() => setSelected(candidate)}><td><div className="candidate-name"><span className="user-avatar avatar-small">{initials(candidate.parsed_name || 'Candidate')}</span><span><b>{candidate.parsed_name || `Candidate #${candidate.id}`}</b><small>{candidate.parsed_email || candidate.parsed_phone || 'Contact not extracted'}</small></span></div></td><td>{application?.job?.title || <span className="muted">Screening only</span>}</td><td><div className="tag-list compact-tags">{(candidate.extracted_skills_json || []).slice(0, 3).map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}{!candidate.extracted_skills_json?.length && <span className="muted">Not available</span>}</div></td><td><span className={`status-pill ${displayedStatus === 'cleared' || displayedStatus === 'done' || displayedStatus === 'shortlisted' || displayedStatus === 'interview' ? 'status-open' : displayedStatus === 'failed' || displayedStatus === 'rejected' ? 'status-closed' : 'status-review'}`}>{displayedStatus === 'cleared' ? 'Cleared' : displayedStatus}</span></td><td><span className="table-score">{match ? `${match.match_percentage}%` : candidate.status === 'done' ? `${candidate.ai_match_percentage ?? 0}%` : '—'}</span></td><td>{application?.status === 'shortlisted' && <button className="icon-button" aria-label={`Queue ${candidate.parsed_name || 'candidate'} for interview invite`} title="Queue for interview invite" onClick={(event) => { event.stopPropagation(); const ids = readInterviewCart(userId); if (!ids.includes(application.id)) writeInterviewCart(userId, [...ids, application.id]); }}><Mail size={15} /></button>}<button className="icon-button danger-icon" aria-label={`Delete ${candidate.parsed_name || 'candidate'}`} title="Delete candidate" onClick={(event) => deleteCandidate(candidate, event)}><Trash2 size={15} /></button><button className="icon-button" aria-label={`View ${candidate.parsed_name || 'candidate'}`}><ArrowRight size={16} /></button></td></tr>; })}</tbody></table></div> : <EmptyState icon={Users} title="No candidates to review" copy="Applicants and privately uploaded resumes appear here after roles receive applications or resume screening." />}
    {meta?.last_page > 1 && <div className="pagination-bar"><span>Showing {meta.from || 0}–{meta.to || 0} of {meta.total || 0}</span><div><button className="button button-quiet" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</button><span>Page {meta.current_page} of {meta.last_page}</span><button className="button button-quiet" disabled={page >= meta.last_page || loading} onClick={() => setPage(page + 1)}>Next</button></div></div>}{selected && <CandidateModal candidate={selected} userId={userId} onClose={() => setSelected(null)} onDelete={deleteCandidate} />}
  </div>;
}

function InterviewCart({ userId }) {
  const [cartIds, setCartIds] = useState(() => readInterviewCart(userId));
  const [applications, setApplications] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = () => {
    setLoading(true);
    api('/applications?status=shortlisted')
      .then((result) => setApplications((result.applications || []).filter((item) => cartIds.includes(item.id))))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };
  useEffect(refresh, [cartIds]);
  const scheduleAll = async () => {
    setError('');
    setNotice('');
    const missing = applications.filter((item) => !schedule[item.id]?.at);
    if (missing.length) {
      setError('Choose an interview date and time for every candidate in the cart.');
      return;
    }

    setBusy(true);
    const results = await Promise.allSettled(applications.map((item) => api(`/applications/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'interview',
        interview_at: new Date(schedule[item.id].at).toISOString(),
        interview_notes: schedule[item.id].notes || null,
      }),
    })));
    const completedIds = applications.filter((item, index) => results[index].status === 'fulfilled').map((item) => item.id);
    const remaining = cartIds.filter((id) => !completedIds.includes(id));
    setCartIds(remaining);
    writeInterviewCart(userId, remaining);
    if (completedIds.length) setNotice(`${completedIds.length} interview${completedIds.length === 1 ? '' : 's'} scheduled.`);
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length) setError(`Could not schedule ${failures.length} interview${failures.length === 1 ? '' : 's'}: ${failures.map((result) => result.reason.message).join('; ')}`);
    setBusy(false);
  };

  const remove = (id) => {
    const updated = cartIds.filter((item) => item !== id);
    setCartIds(updated);
    writeInterviewCart(userId, updated);
  };

  return <div className="page-content"><PageHeader eyebrow="RECRUITER WORKFLOW" title="Interview invite" description="Collect approved candidates, choose individual interview times, and send out invitations together." action={applications.length > 0 && <button className="button button-dark" disabled={busy} onClick={scheduleAll}><CalendarDays size={16} />{busy ? 'Sending invites…' : `Send ${applications.length} interview invite${applications.length === 1 ? '' : 's'}`}</button>} />
    {error && <Notice error>{error}</Notice>}{notice && <Notice>{notice}</Notice>}
    {loading ? <Loading /> : applications.length ? <div className="job-list">{applications.map((item) => <article className="job-row interview-cart-row" key={item.id}><span className="job-icon"><CalendarDays size={18} /></span><div className="job-main"><div className="job-title-line"><h2>{item.candidate?.parsed_name || `Candidate #${item.candidate_id}`}</h2><span className="status-pill status-open">{item.candidate?.ai_match_percentage ?? 0}% match</span></div><p>{item.job?.title} · {item.job?.department || 'Other'}</p><small className="job-match-count">{item.candidate?.parsed_email || 'Email not extracted'}</small><div className="cart-schedule-fields"><label>Interview date and time<input type="datetime-local" value={schedule[item.id]?.at || ''} onChange={(event) => setSchedule({ ...schedule, [item.id]: { ...schedule[item.id], at: event.target.value } })} /></label><label>Meeting details<input value={schedule[item.id]?.notes || ''} onChange={(event) => setSchedule({ ...schedule, [item.id]: { ...schedule[item.id], notes: event.target.value } })} placeholder="Video link or interview notes" /></label></div></div><button className="text-action danger-action" disabled={busy} onClick={() => remove(item.id)}>Remove</button></article>)}</div> : <EmptyState icon={Mail} title="No candidates queued for interview invite" copy="Shortlist candidates from the Candidates tab or their profile to queue them here for batch interview invites." />}
  </div>;
}

function CandidateModal({ candidate, userId, onClose, onDelete }) {
  const [details, setDetails] = useState(candidate); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false); const [applicationId, setApplicationId] = useState(''); const [pendingRejection, setPendingRejection] = useState(false); const [inviteOpen, setInviteOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerForm, setOfferForm] = useState({ joining_date: '', joining_location: '', offer_letter_text: '' });
  useEffect(() => {
    api(`/candidates/${candidate.id}`).then((result) => {
      setDetails(result.candidate);
      const firstApp = result.candidate.applications?.[0];
      setApplicationId(String(firstApp?.id || ''));
      if (firstApp) {
        setOfferForm({
          joining_date: firstApp.joining_date ? firstApp.joining_date.substring(0, 10) : '',
          joining_location: firstApp.joining_location || '',
          offer_letter_text: firstApp.offer_letter_text || '',
        });
      }
    }).catch((e) => setError(e.message));
  }, [candidate.id]);
  const application = details.applications?.find((item) => String(item.id) === applicationId);
  const match = details.matches?.find((item) => item.job_id === application?.job_id);
  const updateApplication = async (payload) => {
    if (!application) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api(`/applications/${application.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      setDetails({ ...details, applications: details.applications.map((item) => item.id === application.id ? result.application : item) });
      setPendingRejection(false);
      setInviteOpen(false);
      setOfferOpen(false);
      setNotice(
        payload.status === 'rejected' ? 'Candidate marked as rejected/interview not cleared.' :
        payload.status === 'cleared' ? 'Interview cleared! Offer letter & joining details released to candidate.' :
        payload.status === 'shortlisted' ? 'Candidate approved for shortlisting.' :
        payload.status === 'interview' ? 'Interview invitation sent.' :
        'Application updated.'
      );
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  const downloadResume = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/candidates/${details.id}/resume`, { headers: { Authorization: `Bearer ${sessionStorage.getItem('ats_token')}`, Accept: 'application/octet-stream' } });
      if (!response.ok) throw new Error('Resume download is unavailable.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = `candidate-resume-${details.id}`; link.click(); URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError.message); }
  };
  const scheduleInterview = (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const date = values.get('interview_at');
    if (!date) { setError('Choose an interview date and time.'); return; }
    updateApplication({ status: 'interview', interview_at: new Date(date).toISOString(), interview_notes: values.get('interview_notes') || null });
  };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal candidate-modal" role="dialog" aria-modal="true" aria-labelledby="candidate-modal-title">
        <div className="modal-heading">
          <div><span className="eyebrow">CANDIDATE PROFILE</span><h2 id="candidate-modal-title">{details.parsed_name || `Candidate #${details.id}`}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        {error && <Notice error>{error}</Notice>}
        {notice && <Notice>{notice}</Notice>}
        <div className="candidate-contact">
          {details.parsed_email && <span>{details.parsed_email}</span>}
          {details.parsed_phone && <span>{details.parsed_phone}</span>}
          <button className="text-action" onClick={downloadResume}><FileText size={14} /> Download resume</button>
          <button className="text-action danger-action" onClick={() => onDelete(details)}><Trash2 size={14} /> Delete candidate</button>
        </div>
        {details.applications?.length > 0 && (
          <section className="detail-section">
            <h3>Applicant workflow</h3>
            <label className="application-select">Job application
              <select value={applicationId} onChange={(event) => setApplicationId(event.target.value)}>
                {details.applications.map((item) => <option key={item.id} value={item.id}>{item.job?.title || `Job #${item.job_id}`}</option>)}
              </select>
            </label>
            <div className="candidate-score-block">
              <span>SKILL MATCH FOR THIS ROLE</span>
              <strong>{match ? `${match.match_percentage}%` : 'Not analyzed'}</strong>
              <small>{match?.raw_json?.match_explanation || 'Match is decision support only. Recruiters can approve any candidate regardless of score.'}</small>
            </div>
            {match?.skill_comparison_json && (
              <>
                <section className="detail-section">
                  <h3>Matching skills</h3>
                  <div className="tag-list">{(match.skill_comparison_json.matched || []).map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}{!match.skill_comparison_json.matched?.length && <span className="muted">No required skills matched.</span>}</div>
                </section>
                <section className="detail-section">
                  <h3>Skills not found in resume</h3>
                  <div className="tag-list">{(match.skill_comparison_json.missing || []).map((skill) => <span className="skill-tag missing-skill-tag" key={skill}>{skill}</span>)}{!match.skill_comparison_json.missing?.length && <span className="muted">All listed skills matched.</span>}</div>
                </section>
              </>
            )}
            <div className="candidate-action-row">
              <span className={`status-pill status-${application?.status === 'rejected' ? 'closed' : application?.status === 'cleared' ? 'open' : application?.status === 'shortlisted' || application?.status === 'interview' ? 'open' : 'review'}`}>
                {application?.status === 'cleared' ? '✓ Interview cleared' : application?.status === 'rejected' ? '✕ Rejected' : application?.status}
              </span>
              <button disabled={busy} className="button button-quiet" onClick={() => { setPendingRejection(false); setOfferOpen(false); setInviteOpen(true); }}>Schedule interview</button>
              <button disabled={busy} className="button button-quiet" style={{ color: '#6d28d9', borderColor: '#c4b5fd' }} onClick={() => { setPendingRejection(false); setInviteOpen(false); setOfferOpen(true); }}>
                🎉 Interview Cleared (Offer & Joining)
              </button>
              <button disabled={busy || application?.status === 'rejected'} className="button button-quiet danger-action" onClick={() => { setInviteOpen(false); setOfferOpen(false); setPendingRejection(true); setNotice('Confirm rejection, then save to notify the job seeker.'); }}>
                Reject candidate
              </button>
              {application?.status === 'shortlisted' && <button className="button button-quiet" onClick={() => { const ids = readInterviewCart(userId); if (!ids.includes(application.id)) writeInterviewCart(userId, [...ids, application.id]); setNotice('Candidate queued for interview invite.'); }}><Mail size={14} /> Add to interview invite</button>}
            </div>

            {application?.status === 'cleared' && (
              <div className="cleared-summary-box" style={{ margin: '14px 0', padding: '12px 14px', borderRadius: '6px', background: '#f5f0fb', border: '1px solid #e9d5ff' }}>
                <b style={{ color: '#5b21b6', fontSize: '11px', display: 'block', marginBottom: '4px' }}>✓ Candidate Interview Cleared</b>
                <small style={{ color: '#6b5585', fontSize: '9px', display: 'block' }}>
                  Joining date: <b>{application.joining_date ? new Date(application.joining_date).toLocaleDateString() : 'Not set'}</b> · Location: <b>{application.joining_location || 'Not set'}</b>
                </small>
                {application.offer_accepted_at ? (
                  <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 8px', borderRadius: '4px', background: '#dcfce7', color: '#166534', fontSize: '9px', fontWeight: 'bold' }}>
                    ✓ Offer Accepted on {new Date(application.offer_accepted_at).toLocaleString()}
                  </span>
                ) : application.offer_declined_at ? (
                  <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 8px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', fontSize: '9px', fontWeight: 'bold' }}>
                    ✕ Offer Declined by Candidate ({new Date(application.offer_declined_at).toLocaleString()})
                  </span>
                ) : (
                  <span style={{ display: 'inline-block', marginTop: '6px', padding: '2px 8px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', fontSize: '9px', fontWeight: 'bold' }}>
                    Awaiting Candidate Offer Response
                  </span>
                )}
              </div>
            )}

            {offerOpen && (
              <form className="interview-form" onSubmit={(e) => {
                e.preventDefault();
                updateApplication({
                  status: 'cleared',
                  joining_date: offerForm.joining_date || null,
                  joining_location: offerForm.joining_location || null,
                  offer_letter_text: offerForm.offer_letter_text || null,
                });
              }}>
                <h3 style={{ color: '#6d28d9' }}>Release Offer & Joining Details (Interview Cleared)</h3>
                <label>
                  Joining date
                  <input
                    type="date"
                    required
                    value={offerForm.joining_date}
                    onChange={(e) => setOfferForm({ ...offerForm, joining_date: e.target.value })}
                  />
                </label>
                <label>
                  Joining location / Work mode
                  <input
                    placeholder="e.g. Bangalore Campus / Remote / Hybrid"
                    required
                    value={offerForm.joining_location}
                    onChange={(e) => setOfferForm({ ...offerForm, joining_location: e.target.value })}
                  />
                </label>
                <label>
                  Offer letter text & salary / compensation terms
                  <textarea
                    rows="5"
                    required
                    placeholder="We are thrilled to extend an offer for the position of Senior Developer at HireFlow. Your compensation will be $90,000 / year..."
                    value={offerForm.offer_letter_text}
                    onChange={(e) => setOfferForm({ ...offerForm, offer_letter_text: e.target.value })}
                  />
                </label>
                <div className="candidate-action-row">
                  <button type="button" className="button button-quiet" disabled={busy} onClick={() => setOfferOpen(false)}>Cancel</button>
                  <button disabled={busy} className="button button-dark" style={{ background: '#6d28d9' }}>
                    {busy ? 'Saving…' : 'Release Offer Letter & Clear Interview'} <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            )}

            {pendingRejection && <div className="candidate-action-row"><button type="button" className="button button-quiet" disabled={busy} onClick={() => setPendingRejection(false)}>Cancel</button><button type="button" className="button button-dark danger-action" disabled={busy} onClick={() => updateApplication({ status: 'rejected' })}>{busy ? 'Saving…' : 'Save rejection'}</button></div>}
            {inviteOpen && <form className="interview-form" onSubmit={scheduleInterview}>
              <h3>Schedule an interview</h3>
              <label>Date and time<input name="interview_at" type="datetime-local" required /></label>
              <label>Invitation details<textarea name="interview_notes" rows="2" placeholder="Add meeting details or a note for the candidate" /></label>
              <div className="candidate-action-row"><button type="button" className="button button-quiet" disabled={busy} onClick={() => updateApplication({ status: 'shortlisted' })}>Save shortlist only</button><button disabled={busy} className="button button-dark"><CalendarDays size={15} />{busy ? 'Sending…' : 'Send interview invite'} <ArrowRight size={14} /></button></div>
            </form>}
          </section>
        )}
        <section className="detail-section">
          <h3>Extracted skills</h3>
          <div className="tag-list">{(details.extracted_skills_json || []).map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}{!details.extracted_skills_json?.length && <span className="muted">No skills were extracted.</span>}</div>
        </section>
        <section className="detail-section">
          <h3>Education</h3>
          {(details.parsed_education_json || []).length ? <ul>{details.parsed_education_json.map((item, index) => <li key={index}>{item.summary || JSON.stringify(item)}</li>)}</ul> : <p className="muted">No education details were returned.</p>}
        </section>
        <section className="detail-section">
          <h3>Experience</h3>
          {(details.parsed_experience_json || []).length ? <ul>{details.parsed_experience_json.map((item, index) => <li key={index}>{item.summary || JSON.stringify(item)}</li>)}</ul> : <p className="muted">No experience details were returned.</p>}
        </section>
        {details.error && <Notice error>{details.error}</Notice>}
      </section>
    </div>
  );
}

function Screening({ userId }) {
  const [view, setView] = useState('list'); // 'list' | 'upload'
  const [matches, setMatches] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('all');
  const [minScore, setMinScore] = useState('0');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Resume upload state
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploadedCandidate, setUploadedCandidate] = useState(null);
  const [uploadedMatches, setUploadedMatches] = useState([]);
  const [dragging, setDragging] = useState(false);

  const fetchMatches = () => {
    setLoading(true);
    api(`/matches${selectedJobId !== 'all' ? `?job_id=${selectedJobId}` : ''}`)
      .then((data) => {
        setMatches(data.matches || []);
        if (data.jobs?.length) setJobs(data.jobs);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMatches();
  }, [selectedJobId]);

  const acceptFile = (incoming) => {
    const selected = incoming?.[0];
    if (!selected) return;
    if (!/\.(pdf|doc|docx)$/i.test(selected.name)) {
      setError('Choose a PDF, DOC, or DOCX resume.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('Resume files must be 10 MB or smaller.');
      return;
    }
    setError('');
    setFile(selected);
  };

  const uploadResume = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError('');
    setUploadedCandidate(null);
    setUploadedMatches([]);
    try {
      const body = new FormData();
      body.append('resume', file);
      const res = await api('/upload-resume', { method: 'POST', body });
      const id = res.candidate.id;
      const processed = await api(`/resumes/${id}/status`);
      setUploadedCandidate(processed.candidate);
      setUploadedMatches(processed.candidate?.matches || []);
      fetchMatches();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteCandidateFromScreening = async (candidate, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Delete candidate "${candidate.parsed_name || `Candidate #${candidate.id}`}"?`)) return;
    try {
      await api(`/candidates/${candidate.id}`, { method: 'DELETE' });
      setSelectedCandidate(null);
      fetchMatches();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter matches
  const filteredMatches = matches.filter((m) => {
    const score = Number(m.match_percentage) || 0;
    if (score < Number(minScore)) return false;

    if (search) {
      const q = search.toLowerCase();
      const candName = (m.candidate?.parsed_name || '').toLowerCase();
      const candEmail = (m.candidate?.parsed_email || '').toLowerCase();
      const jobTitle = (m.job?.title || '').toLowerCase();
      const skills = (m.skill_comparison_json?.matched || []).join(' ').toLowerCase();
      return candName.includes(q) || candEmail.includes(q) || jobTitle.includes(q) || skills.includes(q);
    }
    return true;
  });

  return (
    <div className="page-content">
      <PageHeader
        eyebrow="AI MATCH & SCREENING"
        title="AI Candidate Screening"
        description="Comprehensive table view of AI match percentages, candidate skills overlap, and automated screening results."
        action={
          <div className="screening-top-actions">
            <button
              className={`button ${view === 'list' ? 'button-dark' : 'button-quiet'}`}
              onClick={() => setView('list')}
            >
              <BarChart3 size={15} /> AI Match Table ({matches.length})
            </button>
            <button
              className={`button ${view === 'upload' ? 'button-dark' : 'button-quiet'}`}
              onClick={() => setView('upload')}
            >
              <Plus size={15} /> Screen New Resume
            </button>
          </div>
        }
      />

      {error && <Notice error>{error}</Notice>}

      {view === 'upload' ? (
        <div className="screening-upload-view">
          <div className="upload-view-back">
            <button className="panel-link" onClick={() => setView('list')}>
              ← Back to AI Matches Table
            </button>
          </div>
          <div className="screening-layout">
            <section className="panel upload-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">NEW SCREENING</span>
                  <h2>Upload Candidate Resume</h2>
                </div>
                <span className="secure-label"><span /> PRIVATE</span>
              </div>
              <form onSubmit={uploadResume}>
                <div className="screening-scope">
                  <span className="scope-icon"><Target size={17} /></span>
                  <span>
                    <b>Compare against all open roles</b>
                    <small>{jobs.length} roles currently eligible for matching.</small>
                  </span>
                </div>
                <div
                  className={`drop-zone ${dragging ? 'drop-active' : ''} ${file ? 'drop-has-file' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files); }}
                >
                  <input
                    id="resume-file"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => acceptFile(e.target.files)}
                  />
                  <label htmlFor="resume-file">
                    <span className="drop-icon"><FileText size={20} /></span>
                    <b>{file ? file.name : 'Drop candidate resume here'}</b>
                    <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Change file` : 'or browse files · PDF, DOC, DOCX'}</span>
                  </label>
                </div>
                <p className="upload-limit">Maximum file size 10 MB. Files are stored securely in local storage.</p>
                <button className="button button-dark upload-submit" disabled={!file || busy}>
                  {busy ? <><span className="button-spinner" /> Processing resume…</> : <><Sparkles size={16} /> Analyze & Match Resume</>}
                </button>
              </form>
            </section>
            <aside className="screening-aside">
              <div className="aside-top"><Sparkles size={17} /><span>SCREENING BREAKDOWN</span></div>
              <h3>Automated skill & role scoring.</h3>
              <ul>
                <li><Check size={15} /> Text extraction & contact parsing</li>
                <li><Check size={15} /> Skills matching against job requirements</li>
                <li><Check size={15} /> Match score calculation per open role</li>
                <li><Check size={15} /> Immediate sync to AI Match Table</li>
              </ul>
            </aside>
          </div>
          {uploadedCandidate && <ScreeningResults candidate={uploadedCandidate} matches={uploadedMatches} />}
        </div>
      ) : (
        <div className="screening-list-view">
          <div className="toolbar">
            <label className="search-field">
              <Search size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate name, email, target role, or skill..."
              />
            </label>
            <label className="filter-select">
              <Settings2 size={16} />
              <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
                <option value="all">All job openings</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </label>
            <label className="filter-select">
              <Settings2 size={16} />
              <select value={minScore} onChange={(e) => setMinScore(e.target.value)}>
                <option value="0">All match scores</option>
                <option value="80">80%+ Excellent Match</option>
                <option value="60">60%+ Good Match</option>
                <option value="40">40%+ Fair Match</option>
              </select>
            </label>
            <span className="result-count">{filteredMatches.length} AI matches</span>
          </div>

          {loading ? (
            <Loading label="Loading AI match leaderboard..." />
          ) : !filteredMatches.length ? (
            <EmptyState
              icon={Target}
              title="No AI matches found"
              copy="Candidate matches will appear here as resumes are screened and applications are received for your open roles."
              action={
                <button className="button button-dark" onClick={() => setView('upload')}>
                  <Plus size={15} /> Screen a candidate resume
                </button>
              }
            />
          ) : (
            <div className="candidate-table-wrap">
              <table className="candidate-table ai-screening-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>CANDIDATE</th>
                    <th>TARGET ROLE</th>
                    <th>AI MATCH SCORE</th>
                    <th>MATCHED SKILLS</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((match, index) => {
                    const score = Number(match.match_percentage) || 0;
                    const candidate = match.candidate;
                    const matchedSkills = match.skill_comparison_json?.matched || [];
                    const app = candidate?.applications?.[0];
                    const appStatus = app?.status || candidate?.status || 'review';
                    const scoreTone = score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low';

                    return (
                      <tr key={match.id} onClick={() => candidate && setSelectedCandidate(candidate)}>
                        <td><span className="rank-badge">#{index + 1}</span></td>
                        <td>
                          <div className="candidate-name">
                            <span className="user-avatar avatar-small">
                              {initials(candidate?.parsed_name || 'Candidate')}
                            </span>
                            <span>
                              <b>{candidate?.parsed_name || `Candidate #${match.candidate_id}`}</b>
                              <small>{candidate?.parsed_email || candidate?.parsed_phone || 'No contact on file'}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="match-job-info">
                            <b>{match.job?.title || `Job #${match.job_id}`}</b>
                            {match.job?.department && <small>{match.job.department}</small>}
                          </div>
                        </td>
                        <td>
                          <div className="ai-score-cell">
                            <span className={`ai-score-badge tone-${scoreTone}`}>
                              <Sparkles size={12} /> {score}%
                            </span>
                            <div className="ai-score-bar">
                              <div
                                className={`ai-bar-fill fill-${scoreTone}`}
                                style={{ width: `${Math.min(100, Math.max(6, score))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="tag-list compact-tags">
                            {matchedSkills.slice(0, 3).map((skill) => (
                              <span key={skill} className="skill-tag match-skill-chip">{skill}</span>
                            ))}
                            {matchedSkills.length > 3 && (
                              <span className="skill-tag skill-more">+{matchedSkills.length - 3}</span>
                            )}
                            {!matchedSkills.length && <span className="muted">No overlap</span>}
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill ${
                            appStatus === 'cleared' || appStatus === 'shortlisted' || appStatus === 'interview'
                              ? 'status-open'
                              : appStatus === 'rejected' || appStatus === 'failed'
                              ? 'status-closed'
                              : 'status-review'
                          }`}>
                            {appStatus === 'cleared' ? 'Cleared' : appStatus}
                          </span>
                        </td>
                        <td>
                          <button
                            className="button button-quiet btn-compact"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (candidate) setSelectedCandidate(candidate);
                            }}
                          >
                            <Eye size={13} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedCandidate && (
            <CandidateModal
              candidate={selectedCandidate}
              userId={userId}
              onClose={() => setSelectedCandidate(null)}
              onDelete={deleteCandidateFromScreening}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ScreeningResults({ candidate, matches }) {
  if (candidate.status === 'failed') return <section className="result-panel"><Notice error>Resume processing failed: {candidate.error || 'The backend could not process this resume.'}</Notice></section>;
  return <section className="result-panel"><div className="result-header"><div><span className="eyebrow">PROCESSING RESULT</span><h2>{candidate.parsed_name || 'Resume analyzed'}</h2><p>{candidate.parsed_email || candidate.parsed_phone || 'No contact details were extracted'}</p></div><span className="status-pill status-open">{candidate.status}</span></div><div className="result-summary"><div><span className="eyebrow">BEST MATCH</span><strong>{candidate.status === 'done' ? `${candidate.ai_match_percentage ?? 0}%` : 'Pending'}</strong><small>Service-returned score</small></div><div className="result-skills"><span className="eyebrow">EXTRACTED SKILLS</span><div className="tag-list">{(candidate.extracted_skills_json || []).map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}{!candidate.extracted_skills_json?.length && <span className="muted">No extracted skills available.</span>}</div></div></div>{matches.length > 0 && <div className="match-results"><span className="eyebrow">ROLE MATCHES</span>{matches.map((match) => <div className="match-row" key={match.id}><span>{match.job?.title || `Job #${match.job_id}`}</span><b>{match.match_percentage}%</b><span className={`status-pill ${match.status === 'shortlisted' ? 'status-open' : 'status-review'}`}>{match.status}</span></div>)}</div>}<p className="restricted-note">AI match scores support review and should not be used as the sole basis for a hiring decision.</p></section>;
}

function Account({ user }) {
  const [form, setForm] = useState({
    name: user.name || '',
    company_name: user.company_name || '',
    company_website: user.company_website || '',
    headline: user.headline || '',
    location: user.location || '',
    bio: user.bio || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api('/profile', { method: 'PUT', body: JSON.stringify(form) });
      sessionStorage.setItem('ats_user', JSON.stringify(result.user));
      setNotice('Recruiter profile and company summary updated successfully.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-content">
      <PageHeader
        eyebrow="RECRUITER ACCOUNT & PROFILE"
        title="Recruiter Profile"
        description="View your summarized recruiter details and update company information across your workspace."
      />
      {error && <Notice error>{error}</Notice>}
      {notice && <Notice>{notice}</Notice>}

      {/* Recruiter Summary Hero Card */}
      <div className="recruiter-profile-hero">
        <div className="recruiter-hero-avatar">
          {initials(form.name || user.name)}
        </div>
        <div className="recruiter-hero-info">
          <div className="recruiter-hero-top">
            <h2>{form.name || user.name}</h2>
            <span className="recruiter-role-badge">
              <Award size={12} /> Recruiter & Hiring Lead
            </span>
          </div>
          <p className="recruiter-hero-headline">
            {form.headline || (form.company_name ? `Talent Acquisition at ${form.company_name}` : 'Hiring Specialist & Talent Lead')}
          </p>
          <div className="recruiter-hero-meta">
            <span><Building2 size={13} /> {form.company_name || 'Organization not specified'}</span>
            <span><Mail size={13} /> {user.email}</span>
            <span><MapPin size={13} /> {form.location || 'Headquarters / Remote'}</span>
            {form.company_website && (
              <a href={form.company_website} target="_blank" rel="noopener noreferrer" className="hero-link">
                <Globe size={13} /> {form.company_website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Summarised Workspace Snapshot Grid */}
      <div className="recruiter-stats-grid">
        <div className="recruiter-stat-card">
          <div className="stat-card-top">
            <span className="stat-label">ORGANIZATION</span>
            <Building2 size={16} />
          </div>
          <strong>{form.company_name || 'Your Company'}</strong>
          <small>{form.company_website || 'Add website in details below'}</small>
        </div>
        <div className="recruiter-stat-card">
          <div className="stat-card-top">
            <span className="stat-label">WORKSPACE ROLE</span>
            <Award size={16} />
          </div>
          <strong>{user.role === 'hr' ? 'Hiring Lead / HR' : user.role || 'Recruiter'}</strong>
          <small>Full recruiting & candidate management</small>
        </div>
        <div className="recruiter-stat-card">
          <div className="stat-card-top">
            <span className="stat-label">OFFICE LOCATION</span>
            <MapPin size={16} />
          </div>
          <strong>{form.location || 'Not set'}</strong>
          <small>Primary hiring jurisdiction</small>
        </div>
        <div className="recruiter-stat-card">
          <div className="stat-card-top">
            <span className="stat-label">ACCOUNT ID</span>
            <UserRound size={16} />
          </div>
          <strong>#{user.id}</strong>
          <small>Verified recruiter account</small>
        </div>
      </div>

      {/* Recruiter Bio / About Summary (if provided) */}
      {form.bio && (
        <div className="recruiter-bio-summary">
          <span className="eyebrow">COMPANY & RECRUITER SUMMARY</span>
          <p>{form.bio}</p>
        </div>
      )}

      {/* Edit & Update Profile Form */}
      <form className="panel recruiter-edit-panel" onSubmit={save}>
        <div className="edit-panel-header">
          <div className="edit-panel-icon"><Settings2 size={20} /></div>
          <div>
            <span className="eyebrow">EDIT & UPDATE PROFILE</span>
            <h2>Update recruiter details</h2>
            <p>Modify contact info, company details, and hiring headlines displayed to applicants.</p>
          </div>
        </div>

        <div className="edit-form-section">
          <div className="edit-section-label"><UserRound size={14} /> Personal Information</div>
          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="prof-name">Contact full name</label>
              <input
                id="prof-name"
                required
                maxLength="255"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div className="form-field">
              <label htmlFor="prof-email">Registered email <span className="field-lock">🔒 Read-only</span></label>
              <input
                id="prof-email"
                disabled
                value={user.email}
                readOnly
                className="input-disabled"
                title="Registered account email — cannot be changed"
              />
            </div>
            <div className="form-field">
              <label htmlFor="prof-headline">Professional headline</label>
              <input
                id="prof-headline"
                maxLength="255"
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder="e.g. Lead Talent Acquisition Partner"
              />
            </div>
            <div className="form-field">
              <label htmlFor="prof-location">Hiring location / Office</label>
              <input
                id="prof-location"
                maxLength="255"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. New York, NY · Hybrid"
              />
            </div>
          </div>
        </div>

        <div className="edit-form-section">
          <div className="edit-section-label"><Building2 size={14} /> Company Details</div>
          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="prof-company">Company / Organization name</label>
              <input
                id="prof-company"
                maxLength="255"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="e.g. Acme Innovations"
              />
            </div>
            <div className="form-field">
              <label htmlFor="prof-website">Company website URL</label>
              <div className="input-with-icon">
                <Globe size={14} />
                <input
                  id="prof-website"
                  type="url"
                  maxLength="255"
                  value={form.company_website}
                  onChange={(e) => setForm({ ...form, company_website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="edit-form-section">
          <div className="edit-section-label"><FileText size={14} /> Company Bio & Overview</div>
          <div className="form-field">
            <label htmlFor="prof-bio">Company & Recruiter overview</label>
            <textarea
              id="prof-bio"
              rows="5"
              maxLength="5000"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Introduce your company culture, mission, and what your hiring team looks for in candidates..."
            />
            <span className="field-char-count">{form.bio.length} / 5,000 characters</span>
          </div>
        </div>

        <div className="form-action-bar">
          <span className="form-action-hint">All changes are applied immediately across your workspace.</span>
          <button className="button button-dark" disabled={busy}>
            {busy ? (
              <><span className="button-spinner" /> Saving changes…</>
            ) : (
              <><Check size={16} /> Save Profile Changes</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;