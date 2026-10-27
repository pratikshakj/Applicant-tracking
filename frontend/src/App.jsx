import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import JobSeekerDashboard from './JobSeekerDashboard.jsx';
import {
  ArrowDownRight, ArrowRight, BriefcaseBusiness, Check, ChevronDown, CircleHelp,
  FileText, LayoutDashboard, LogOut, MapPin, Menu, Plus, Search, Settings2, Sparkles,
  Target, UserRound, Users, X,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || '';

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
  { key: 'screening', label: 'AI screening', icon: Sparkles },
];

function Workspace({ user, onSignOut }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { const key = location.pathname.split('/')[2]; if (sections.some((section) => section.key === key)) setActive(key); else setActive('overview'); }, [location.pathname]);
  const go = (key) => { setActive(key); navigate(`/workspace/${key}`); setMobileOpen(false); };
  return <div className="workspace">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}><div className="sidebar-brand"><Brand /><button className="icon-button close-menu" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button></div><div className="workspace-label">WORKSPACE</div><nav className="side-nav">{sections.map(({ key, label, icon: Icon }) => <button key={key} className={`side-link ${active === key ? 'active' : ''}`} onClick={() => go(key)}><Icon size={17} />{label}{key === 'screening' && <span className="side-new">AI</span>}</button>)}</nav><div className="sidebar-bottom"><div className="help-box"><CircleHelp size={17} /><span><b>Need a hand?</b><small>Read the project guide</small></span><ArrowRight size={14} /></div><button className="account-button" onClick={() => go('account')}><span className="user-avatar">{initials(user.name)}</span><span className="account-copy"><b>{user.name}</b><small>{user.company_name || 'Recruiter account'}</small></span><ChevronDown size={15} /></button></div></aside>
    <main className="workspace-main"><header className="workspace-top"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button><span className="breadcrumb">Hiring workspace <span>/</span> {sectionTitle(active)}</span><div className="top-actions"><span className="api-status"><i /> RECRUITER VIEW</span><button onClick={onSignOut} className="signout-button"><LogOut size={16} /><span>Sign out</span></button></div></header>
      <Routes><Route index element={<Navigate to="overview" replace />} /><Route path="overview" element={<Dashboard user={user} onNavigate={go} />} /><Route path="jobs" element={<Jobs />} /><Route path="candidates" element={<Candidates />} /><Route path="screening" element={<Screening />} /><Route path="account" element={<Account user={user} />} /><Route path="*" element={<Navigate to="overview" replace />} /></Routes>
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
      <section className="metric-grid"><Metric label="OPEN ROLES" value={jobs.filter((job) => job.status === 'open').length} detail={`${jobs.length} total roles`} icon={BriefcaseBusiness} tone="peach" /><Metric label="CANDIDATES" value={data?.stats?.total_candidates ?? 0} detail="Resumes in your workspace" icon={Users} tone="mint" /><Metric label="AI MATCHES" value={data?.stats?.total_matches ?? 0} detail="Across your open roles" icon={Target} tone="lemon" /><Metric label="SHORTLISTED" value={data?.stats?.shortlisted ?? 0} detail="Flagged for review" icon={Sparkles} tone="lilac" /></section>
      <div className="overview-grid"><section className="panel roles-panel"><div className="panel-heading"><div><span className="eyebrow">ROLE ACTIVITY</span><h2>Your openings</h2></div><button className="panel-link" onClick={() => onNavigate('jobs')}>All roles <ArrowRight size={15} /></button></div>{jobs.length ? <div className="role-list">{jobs.slice(0, 5).map((job) => <div className="role-row" key={job.id}><span className="role-symbol"><BriefcaseBusiness size={17} /></span><div className="role-title"><b>{job.title}</b><small>{(job.required_skills_json || []).slice(0, 3).join(' · ') || 'Skills not specified'}</small></div><span className={`status-pill ${job.status === 'open' ? 'status-open' : 'status-closed'}`}>{job.status}</span><span className="role-count">{job.matches_count ?? 0} <small>matches</small></span></div>)}</div> : <EmptyState icon={BriefcaseBusiness} title="No openings yet" copy="Create your first role to begin reviewing candidates." action={<button className="text-action" onClick={() => onNavigate('jobs')}>Create a job <ArrowRight size={14} /></button>} />}</section>
      <section className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow">RECENT RESUMES</span><h2>Candidate activity</h2></div><button className="icon-button" onClick={() => onNavigate('candidates')} aria-label="View candidates"><ArrowRight size={17} /></button></div>{(data?.recent_activities || []).length ? <div className="activity-list">{data.recent_activities.slice(0, 5).map((candidate) => <div className="activity-row" key={candidate.id}><span className="user-avatar avatar-small">{initials(candidate.parsed_name || 'Candidate')}</span><span className="activity-copy"><b>{candidate.parsed_name || `Candidate #${candidate.id}`}</b><small>{candidate.status === 'done' ? 'Resume analyzed' : candidate.status}</small></span><span className="activity-score">{candidate.ai_match_percentage || 0}%</span></div>)}</div> : <EmptyState icon={FileText} title="No candidate activity" copy="Uploaded resumes and their actual processing results will appear here." />}</section></div>
      <section className="bottom-note"><span className="note-mark"><Sparkles size={17} /></span><span><b>AI matching is decision support.</b><small>Review extracted skills and resume context before making hiring decisions.</small></span><span className="note-actual">Scores from your configured service</span></section>
    </>}
  </div>;
}
function greeting() { const hour = new Date().getHours(); return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'; }
function Metric({ label, value, detail, icon: Icon, tone }) { return <article className="metric"><div className="metric-top"><span>{label}</span><i className={`metric-icon ${tone}`}><Icon size={17} /></i></div><strong>{value ?? '—'}</strong><small>{detail}</small></article>; }

function Jobs() {
  const [jobs, setJobs] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [modal, setModal] = useState(null); const [notice, setNotice] = useState('');
  const refresh = () => { setLoading(true); api('/jobs').then((result) => setJobs(result.jobs || [])).catch((e) => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(refresh, []);
  const visible = jobs.filter((job) => `${job.title} ${(job.required_skills_json || []).join(' ')} ${job.description}`.toLowerCase().includes(query.toLowerCase()));
  const remove = async (job) => { if (!window.confirm(`Delete “${job.title}”? This cannot be undone.`)) return; try { await api(`/jobs/${job.id}`, { method: 'DELETE' }); setNotice('Job deleted.'); refresh(); } catch (e) { setError(e.message); } };
  const save = async (form) => { await api(modal?.id ? `/jobs/${modal.id}` : '/jobs', { method: modal?.id ? 'PUT' : 'POST', body: JSON.stringify(form) }); setModal(null); setNotice(modal?.id ? 'Job updated.' : 'Job created.'); refresh(); };
  return <div className="page-content"><PageHeader eyebrow="ROLE MANAGEMENT" title="Job openings" description="Write clear briefs, keep requirements current, and manage your active roles." action={<button className="button button-dark" onClick={() => setModal({})}><Plus size={16} /> Create a job</button>} />
    <div className="toolbar"><label className="search-field"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search roles or skills" /></label><span className="result-count">{visible.length} {visible.length === 1 ? 'role' : 'roles'}</span></div>
    {notice && <Notice>{notice}</Notice>}{error && <Notice error>{error}</Notice>}{loading ? <Loading /> : visible.length ? <div className="job-list">{visible.map((job) => <article className="job-row" key={job.id}><span className="job-icon"><BriefcaseBusiness size={18} /></span><div className="job-main"><div className="job-title-line"><h2>{job.title}</h2><span className={`status-pill ${job.status === 'open' ? 'status-open' : 'status-closed'}`}>{job.status}</span></div><p>{job.experience_requirements || 'Experience requirements not specified'}</p><div className="tag-list">{(job.required_skills_json || []).map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}</div><small className="job-match-count">{job.matches_count ?? 0} matched candidates</small></div><div className="job-actions"><button className="text-action" onClick={() => setModal(job)}>Edit</button><button className="text-action danger-action" onClick={() => remove(job)}>Delete</button></div></article>)}</div> : <EmptyState icon={BriefcaseBusiness} title={query ? 'No roles match that search' : 'Start with your first opening'} copy={query ? 'Try another title or skill.' : 'Create a role to start organizing your hiring workflow.'} action={!query && <button className="button button-dark" onClick={() => setModal({})}><Plus size={16} /> Create a job</button>} />}
    {modal && <JobModal job={modal} onClose={() => setModal(null)} onSave={save} />}
  </div>;
}

function JobModal({ job, onClose, onSave }) {
  const [form, setForm] = useState({ title: job.title || '', description: job.description || '', skills: (job.required_skills_json || []).join(', '), experience_requirements: job.experience_requirements || '', status: job.status || 'open' });
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  const submit = async (event) => { event.preventDefault(); setPending(true); setError(''); try { await onSave({ title: form.title, description: form.description, required_skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean), experience_requirements: form.experience_requirements || null, status: form.status }); } catch (e) { setError(e.message); } finally { setPending(false); } };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="job-modal-title"><div className="modal-heading"><div><span className="eyebrow">ROLE DETAILS</span><h2 id="job-modal-title">{job.id ? 'Edit job opening' : 'Create job opening'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div><form onSubmit={submit}><label>Job title<input required maxLength={255} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Senior product designer" /></label><label>Job description<textarea required rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the role and responsibilities" /></label><label>Required skills <span className="field-hint">COMMA SEPARATED</span><input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Research, Figma, prototyping" /></label><label>Experience requirements<input value={form.experience_requirements} onChange={(e) => setForm({ ...form, experience_requirements: e.target.value })} placeholder="3+ years, product design" /></label><label>Listing status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="open">Open</option><option value="closed">Closed</option></select></label>{error && <Notice error>{error}</Notice>}<div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button disabled={pending} className="button button-dark">{pending ? 'Saving…' : 'Save role'} <ArrowRight size={15} /></button></div></form></section></div>;
}

function Candidates() {
  const [candidates, setCandidates] = useState([]); const [meta, setMeta] = useState(null); const [jobs, setJobs] = useState([]); const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [jobId, setJobId] = useState(''); const [page, setPage] = useState(1); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [selected, setSelected] = useState(null);
  useEffect(() => { api('/jobs').then((result) => setJobs(result.jobs || [])).catch((e) => setError(e.message)); }, []);
  useEffect(() => { const timer = setTimeout(() => { setLoading(true); setError(''); const params = new URLSearchParams({ per_page: '20', page: String(page) }); if (search) params.set('search', search); if (status) params.set('status', status); if (jobId) params.set('job_id', jobId); api(`/candidates?${params}`).then((result) => { setCandidates(result.data || []); setMeta(result); }).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, 250); return () => clearTimeout(timer); }, [search, status, jobId, page]);
  return <div className="page-content"><PageHeader eyebrow="TALENT POOL" title="Candidates" description="Review parsed resume details and matching results tied to your workspace." />
    <div className="toolbar"><label className="search-field"><Search size={17} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or email" /></label><label className="filter-select"><Settings2 size={16} /><select value={jobId} onChange={(e) => { setJobId(e.target.value); setPage(1); }}><option value="">All job openings</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></label><label className="filter-select"><Settings2 size={16} /><select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All applicants</option><option value="applied">Applied</option><option value="shortlisted">Shortlisted</option><option value="interview">Interview</option><option value="rejected">Rejected</option><option value="done">Resume analyzed</option><option value="parsing">Processing</option><option value="failed">Needs attention</option></select></label><span className="result-count">{meta?.total ?? candidates.length} candidates</span></div>
    {error && <Notice error>{error}</Notice>}{loading ? <Loading /> : candidates.length ? <div className="candidate-table-wrap"><table className="candidate-table"><thead><tr><th>CANDIDATE</th><th>APPLIED ROLE</th><th>EXTRACTED SKILLS</th><th>STATUS</th><th>BEST MATCH</th><th /></tr></thead><tbody>{candidates.map((candidate) => { const application = candidate.applications?.[0]; const displayedStatus = application?.status || candidate.status; const match = candidate.matches?.find((item) => item.job_id === application?.job_id); return <tr key={candidate.id} onClick={() => setSelected(candidate)}><td><div className="candidate-name"><span className="user-avatar avatar-small">{initials(candidate.parsed_name || 'Candidate')}</span><span><b>{candidate.parsed_name || `Candidate #${candidate.id}`}</b><small>{candidate.parsed_email || candidate.parsed_phone || 'Contact not extracted'}</small></span></div></td><td>{application?.job?.title || <span className="muted">Screening only</span>}</td><td><div className="tag-list compact-tags">{(candidate.extracted_skills_json || []).slice(0, 3).map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}{!candidate.extracted_skills_json?.length && <span className="muted">Not available</span>}</div></td><td><span className={`status-pill ${displayedStatus === 'done' || displayedStatus === 'shortlisted' || displayedStatus === 'interview' ? 'status-open' : displayedStatus === 'failed' || displayedStatus === 'rejected' ? 'status-closed' : 'status-review'}`}>{displayedStatus}</span></td><td><span className="table-score">{match ? `${match.match_percentage}%` : candidate.status === 'done' ? `${candidate.ai_match_percentage ?? 0}%` : '—'}</span></td><td><button className="icon-button" aria-label={`View ${candidate.parsed_name || 'candidate'}`}><ArrowRight size={16} /></button></td></tr>; })}</tbody></table></div> : <EmptyState icon={Users} title="No candidates to review" copy="Applicants and privately uploaded resumes appear here after roles receive applications or resume screening." />}
    {meta?.last_page > 1 && <div className="pagination-bar"><span>Showing {meta.from || 0}–{meta.to || 0} of {meta.total || 0}</span><div><button className="button button-quiet" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</button><span>Page {meta.current_page} of {meta.last_page}</span><button className="button button-quiet" disabled={page >= meta.last_page || loading} onClick={() => setPage(page + 1)}>Next</button></div></div>}{selected && <CandidateModal candidate={selected} onClose={() => setSelected(null)} />}
  </div>;
}

function CandidateModal({ candidate, onClose }) {
  const [details, setDetails] = useState(candidate); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false); const [applicationId, setApplicationId] = useState('');
  useEffect(() => { api(`/candidates/${candidate.id}`).then((result) => { setDetails(result.candidate); setApplicationId(String(result.candidate.applications?.[0]?.id || '')); }).catch((e) => setError(e.message)); }, [candidate.id]);
  const application = details.applications?.find((item) => String(item.id) === applicationId);
  const match = details.matches?.find((item) => item.job_id === application?.job_id);
  const updateApplication = async (payload) => {
    if (!application) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api(`/applications/${application.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      setDetails({ ...details, applications: details.applications.map((item) => item.id === application.id ? result.application : item) });
      setNotice('Application updated.');
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
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="modal candidate-modal" role="dialog" aria-modal="true" aria-labelledby="candidate-modal-title"><div className="modal-heading"><div><span className="eyebrow">CANDIDATE PROFILE</span><h2 id="candidate-modal-title">{details.parsed_name || `Candidate #${details.id}`}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div>{error && <Notice error>{error}</Notice>}{notice && <Notice>{notice}</Notice>}<div className="candidate-contact">{details.parsed_email && <span>{details.parsed_email}</span>}{details.parsed_phone && <span>{details.parsed_phone}</span>}<button className="text-action" onClick={downloadResume}><FileText size={14} /> Download resume</button></div>
    {details.applications?.length > 0 && <section className="detail-section"><h3>Applicant workflow</h3><label className="application-select">Job application<select value={applicationId} onChange={(event) => setApplicationId(event.target.value)}>{details.applications.map((item) => <option key={item.id} value={item.id}>{item.job?.title || `Job #${item.job_id}`}</option>)}</select></label><div className="candidate-score-block"><span>SKILL MATCH FOR THIS ROLE</span><strong>{match ? `${match.match_percentage}%` : 'Not analyzed'}</strong><small>{match?.raw_json?.match_explanation || 'Score is based on overlap with the role’s stated skills; it is decision support only.'}</small></div>{match?.skill_comparison_json && <><div className="detail-section"><h3>Matching skills</h3><div className="tag-list">{(match.skill_comparison_json.matched || []).map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}{!match.skill_comparison_json.matched?.length && <span className="muted">No required skills matched.</span>}</div></div><div className="detail-section"><h3>Skills not found in resume</h3><div className="tag-list">{(match.skill_comparison_json.missing || []).map((skill) => <span className="skill-tag missing-skill-tag" key={skill}>{skill}</span>)}{!match.skill_comparison_json.missing?.length && <span className="muted">All listed skills matched.</span>}</div></div></>}<div className="candidate-action-row"><span className={`status-pill status-${application?.status === 'rejected' ? 'closed' : application?.status === 'shortlisted' || application?.status === 'interview' ? 'open' : 'review'}`}>{application?.status}</span><button disabled={busy} className="button button-quiet" onClick={() => updateApplication({ status: 'shortlisted' })}>Shortlist</button><button disabled={busy} className="button button-quiet danger-action" onClick={() => updateApplication({ status: 'rejected' })}>Reject</button></div><form className="interview-form" onSubmit={scheduleInterview}><h3>Schedule an interview</h3><label>Date and time<input name="interview_at" type="datetime-local" required /></label><label>Invitation details<textarea name="interview_notes" rows="2" placeholder="Add meeting details or a note for the candidate" /></label><button disabled={busy} className="button button-dark">Send interview invitation <ArrowRight size={14} /></button></form></section>}
    <div className="candidate-score-block"><span>BEST MATCH SCORE ACROSS ROLES</span><strong>{details.status === 'done' ? `${details.ai_match_percentage ?? 0}%` : 'Not available'}</strong><small>Based on resume skill evidence; never an automatic hiring decision.</small></div><section className="detail-section"><h3>Extracted skills</h3><div className="tag-list">{(details.extracted_skills_json || []).map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}{!details.extracted_skills_json?.length && <span className="muted">No skills were extracted.</span>}</div></section><section className="detail-section"><h3>Education</h3>{(details.parsed_education_json || []).length ? <ul>{details.parsed_education_json.map((item, index) => <li key={index}>{item.summary || JSON.stringify(item)}</li>)}</ul> : <p className="muted">No education details were returned.</p>}</section><section className="detail-section"><h3>Experience</h3>{(details.parsed_experience_json || []).length ? <ul>{details.parsed_experience_json.map((item, index) => <li key={index}>{item.summary || JSON.stringify(item)}</li>)}</ul> : <p className="muted">No experience details were returned.</p>}</section>{details.error && <Notice error>{details.error}</Notice>}</section></div>;
}

function Screening() {
  const [jobs, setJobs] = useState([]); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [candidate, setCandidate] = useState(null); const [matches, setMatches] = useState([]); const [error, setError] = useState(''); const [dragging, setDragging] = useState(false);
  useEffect(() => { api('/jobs').then((result) => setJobs((result.jobs || []).filter((job) => job.status === 'open'))).catch((e) => setError(e.message)); }, []);
  const upload = async (event) => { event.preventDefault(); if (!file) return; setBusy(true); setError(''); setCandidate(null); setMatches([]); try { const body = new FormData(); body.append('resume', file); const result = await api('/upload-resume', { method: 'POST', body }); const id = result.candidate.id; const processed = await api(`/resumes/${id}/status`); setCandidate(processed.candidate); setMatches(processed.candidate?.matches || []); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const acceptFile = (incoming) => { const selected = incoming?.[0]; if (!selected) return; if (!/\.(pdf|doc|docx)$/i.test(selected.name)) { setError('Choose a PDF, DOC, or DOCX resume.'); return; } if (selected.size > 10 * 1024 * 1024) { setError('Resume files must be 10 MB or smaller.'); return; } setError(''); setFile(selected); };
  return <div className="page-content"><PageHeader eyebrow="AI-ASSISTED REVIEW" title="Resume screening" description="Upload a resume to extract details and compare it against your open roles." />
    {error && <Notice error>{error}</Notice>}
    {!jobs.length ? <EmptyState icon={BriefcaseBusiness} title="Create an open role first" copy="Resume matching compares a candidate against your open jobs. Add a job opening before uploading." /> : <div className="screening-layout"><section className="panel upload-panel"><div className="panel-heading"><div><span className="eyebrow">NEW SCREENING</span><h2>Add a resume</h2></div><span className="secure-label"><span /> PRIVATE</span></div><form onSubmit={upload}><div className="screening-scope"><span className="scope-icon"><Target size={17} /></span><span><b>Compare against all open roles</b><small>{jobs.length} {jobs.length === 1 ? 'role is' : 'roles are'} currently eligible for matching.</small></span></div><div className={`drop-zone ${dragging ? 'drop-active' : ''} ${file ? 'drop-has-file' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files); }}><input id="resume-file" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => acceptFile(e.target.files)} /><label htmlFor="resume-file"><span className="drop-icon"><FileText size={20} /></span><b>{file ? file.name : 'Drop a resume here'}</b><span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Change file` : 'or browse files · PDF, DOC, DOCX'}</span></label></div><p className="upload-limit">Maximum file size 10 MB. Uploaded files are held in the backend’s private local storage.</p><button className="button button-dark upload-submit" disabled={!file || busy}>{busy ? <><span className="button-spinner" /> Processing resume…</> : <><Sparkles size={16} /> Analyze resume</>}</button></form></section>
      <aside className="screening-aside"><div className="aside-top"><Sparkles size={17} /><span>WHAT GETS RETURNED</span></div><h3>A closer look at the resume.</h3><ul><li><Check size={15} /> Contact details, when found</li><li><Check size={15} /> Skills, education, experience</li><li><Check size={15} /> Match score and skill overlap</li><li><Check size={15} /> Candidate ranking per open role</li></ul><p>Scores and extracted details are shown only when returned by the configured AI service or local matcher.</p></aside></div>}
    {candidate && <ScreeningResults candidate={candidate} matches={matches} />}
  </div>;
}

function ScreeningResults({ candidate, matches }) {
  if (candidate.status === 'failed') return <section className="result-panel"><Notice error>Resume processing failed: {candidate.error || 'The backend could not process this resume.'}</Notice></section>;
  return <section className="result-panel"><div className="result-header"><div><span className="eyebrow">PROCESSING RESULT</span><h2>{candidate.parsed_name || 'Resume analyzed'}</h2><p>{candidate.parsed_email || candidate.parsed_phone || 'No contact details were extracted'}</p></div><span className="status-pill status-open">{candidate.status}</span></div><div className="result-summary"><div><span className="eyebrow">BEST MATCH</span><strong>{candidate.status === 'done' ? `${candidate.ai_match_percentage ?? 0}%` : 'Pending'}</strong><small>Service-returned score</small></div><div className="result-skills"><span className="eyebrow">EXTRACTED SKILLS</span><div className="tag-list">{(candidate.extracted_skills_json || []).map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}{!candidate.extracted_skills_json?.length && <span className="muted">No extracted skills available.</span>}</div></div></div>{matches.length > 0 && <div className="match-results"><span className="eyebrow">ROLE MATCHES</span>{matches.map((match) => <div className="match-row" key={match.id}><span>{match.job?.title || `Job #${match.job_id}`}</span><b>{match.match_percentage}%</b><span className={`status-pill ${match.status === 'shortlisted' ? 'status-open' : 'status-review'}`}>{match.status}</span></div>)}</div>}<p className="restricted-note">AI match scores support review and should not be used as the sole basis for a hiring decision.</p></section>;
}

function Account({ user }) {
  const [form, setForm] = useState({ name: user.name || '', company_name: user.company_name || '', company_website: user.company_website || '', headline: user.headline || '', location: user.location || '', bio: user.bio || '' });
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const result = await api('/profile', { method: 'PUT', body: JSON.stringify(form) });
      sessionStorage.setItem('ats_user', JSON.stringify(result.user));
      setNotice('Recruiter profile saved.');
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  return <div className="page-content"><PageHeader eyebrow="COMPANY PROFILE" title="Recruiter account" description="Manage the recruiter and company information associated with your workspace." />{error && <Notice error>{error}</Notice>}{notice && <Notice>{notice}</Notice>}<form className="panel account-panel recruiter-profile-form" onSubmit={save}><div className="account-large"><span className="user-avatar">{initials(form.name)}</span><div><h2>{form.name}</h2><span>{user.email}</span></div></div><label>Contact name<input required maxLength="255" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Company name<input maxLength="255" value={form.company_name} onChange={(event) => setForm({ ...form, company_name: event.target.value })} /></label><label>Company website<input type="url" maxLength="255" value={form.company_website} onChange={(event) => setForm({ ...form, company_website: event.target.value })} placeholder="https://example.com" /></label><label>Professional headline<input maxLength="255" value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} placeholder="Talent acquisition at Example Co" /></label><label>Location<input maxLength="255" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label><label>Company / recruiter profile<textarea rows="4" maxLength="5000" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label><button className="button button-dark" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button><dl><div><dt>Role</dt><dd>{user.role || 'Recruiter'}</dd></div><div><dt>Account ID</dt><dd>{user.id}</dd></div></dl></form></div>;
}

export default App;