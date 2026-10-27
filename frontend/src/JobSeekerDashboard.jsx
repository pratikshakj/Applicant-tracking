import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowRight, Bell, BriefcaseBusiness, Check, CircleUserRound, FileText, LogOut, Search, Sparkles, UserRound, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function seekerApi(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  const token = sessionStorage.getItem('ats_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const validation = data.errors ? Object.values(data.errors).flat().join(' ') : '';
    throw new Error(validation || data.message || `Request failed (${response.status})`);
  }

  return response.json();
}

function splitList(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function SeekerNotice({ children, error = false }) {
  return <div className={`seeker-notice ${error ? 'is-error' : ''}`} role={error ? 'alert' : 'status'}>{children}</div>;
}

export default function JobSeekerDashboard({ user, onSignOut }) {
  const [section, setSection] = useState('discover');
  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [resume, setResume] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [profileForm, setProfileForm] = useState({ name: user.name || '', headline: '', location: '', bio: '', skills: '', preferred_job_titles: '', preferred_location: '' });

  const refreshData = async () => {
    setLoading(true);
    setError('');
    try {
      const [jobPage, profileData, recommendationData, applicationData] = await Promise.all([
        seekerApi('/public/jobs?per_page=50'),
        seekerApi('/profile'),
        seekerApi('/user/recommendations'),
        seekerApi('/user/applications'),
      ]);
      setJobs(jobPage.data || []);
      setProfile(profileData.user);
      setResume(profileData.latest_resume);
      setRecommendations(recommendationData.recommendations || []);
      setApplications(applicationData.applications || []);
      setProfileForm({
        name: profileData.user.name || '',
        headline: profileData.user.headline || '',
        location: profileData.user.location || '',
        bio: profileData.user.bio || '',
        skills: (profileData.user.skills_json || []).join(', '),
        preferred_job_titles: (profileData.user.preferred_job_titles_json || []).join(', '),
        preferred_location: profileData.user.preferred_location || '',
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshData(); }, []);

  const appliedJobIds = useMemo(() => new Set(applications.map((application) => application.job_id)), [applications]);
  const filteredJobs = jobs.filter((job) => `${job.title} ${job.user?.company_name || ''} ${(job.required_skills_json || []).join(' ')} ${job.description}`.toLowerCase().includes(search.toLowerCase()));
  const upcomingInterviews = applications.filter((application) => application.interview_at && new Date(application.interview_at) >= new Date());

  const apply = async (job) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await seekerApi(`/user/jobs/${job.id}/apply`, { method: 'POST' });
      setNotice(`Your application for ${job.title} was submitted.`);
      setSelectedJob(null);
      await refreshData();
      setSection('applications');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await seekerApi('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileForm.name,
          headline: profileForm.headline,
          location: profileForm.location,
          bio: profileForm.bio,
          skills: splitList(profileForm.skills),
          preferred_job_titles: splitList(profileForm.preferred_job_titles),
          preferred_location: profileForm.preferred_location,
        }),
      });
      setProfile(result.user);
      sessionStorage.setItem('ats_user', JSON.stringify(result.user));
      setNotice('Your profile and recommendation preferences have been updated.');
      await refreshData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const uploadResume = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData();
    const file = event.currentTarget.elements.resume.files[0];
    if (!file) return;
    form.append('resume', file);
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await seekerApi('/user/resumes', { method: 'POST', body: form });
      setResume(result.candidate);
      setNotice('Resume analyzed from its readable text. Extracted skills now inform your recommendations and job matches.');
      await refreshData();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
      formElement.reset();
    }
  };

  const downloadResume = async () => {
    if (!resume?.id) return;
    try {
      const response = await fetch(`${API_URL}/user/resumes/${resume.id}/download`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('ats_token')}` },
      });
      if (!response.ok) throw new Error('Resume download is unavailable.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume-${resume.id}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return <main className="seeker-app">
    <header className="seeker-app-top">
      <Link className="seeker-brand" to="/"><span><Sparkles size={16} /></span>HireFlow</Link>
      <nav className="seeker-nav" aria-label="Job seeker navigation">
        {[['discover', 'Find jobs'], ['recommended', 'For you'], ['applications', 'Applications'], ['profile', 'My profile']].map(([key, label]) =>
          <button key={key} className={section === key ? 'selected' : ''} onClick={() => { setSection(key); setError(''); }}>{label}{key === 'applications' && applications.length > 0 && <small>{applications.length}</small>}</button>)}
      </nav>
      <div className="seeker-app-account"><span className="seeker-app-avatar">{(profile?.name || user.name).split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span><span>{profile?.name || user.name}</span><button className="seeker-signout" onClick={onSignOut}><LogOut size={15} /> <span>Sign out</span></button></div>
    </header>

    <div className="seeker-app-content">
      {(error || notice) && <SeekerNotice error={Boolean(error)}>{error || notice}</SeekerNotice>}
      {section === 'discover' && <section>
        <div className="seeker-welcome-panel"><div><span className="seeker-eyebrow">YOUR NEXT CHAPTER</span><h1>Good opportunities<br /><em>start with a search.</em></h1><p>Explore open roles, compare the requirements, and apply with your resume.</p></div><div className="seeker-welcome-art"><BriefcaseBusiness size={27} /><span>Make your next move</span><small>Clear roles. Real skills. Your decision.</small></div></div>
        {upcomingInterviews.length > 0 && <button className="seeker-interview-banner" onClick={() => setSection('applications')}><Bell size={18} /><span><b>You have {upcomingInterviews.length} upcoming interview{upcomingInterviews.length === 1 ? '' : 's'}</b><small>See the invitation and interview details in your applications.</small></span><ArrowRight size={17} /></button>}
        <div className="seeker-board-heading"><div><span className="seeker-eyebrow">OPEN OPPORTUNITIES</span><h2>Find a role that fits</h2></div><span>{filteredJobs.length} roles</span></div>
        <label className="seeker-search seeker-search-pro"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search job title, company, description, or skill" /></label>
        {loading ? <div className="seeker-loading">Loading open roles…</div> : filteredJobs.length ? <div className="seeker-job-grid">{filteredJobs.map((job) => <article className="seeker-job-card" key={job.id}>
          <div className="seeker-job-card-top"><span className="seeker-job-icon"><BriefcaseBusiness size={18} /></span><span className="seeker-open-tag">OPEN</span></div>
          <h3>{job.title}</h3><p className="seeker-company">{job.user?.company_name || 'Company not specified'}</p>
          <p className="seeker-job-copy">{job.description}</p>
          {job.experience_requirements && <p className="seeker-exp"><Check size={13} /> {job.experience_requirements}</p>}
          <div className="seeker-skill-tags">{(job.required_skills_json || []).slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}</div>
          <div className="seeker-job-card-actions"><button className="seeker-link-button" onClick={() => setSelectedJob(job)}>View details <ArrowRight size={14} /></button><button className="seeker-primary-button" disabled={appliedJobIds.has(job.id)} onClick={() => setSelectedJob(job)}>{appliedJobIds.has(job.id) ? 'Applied' : 'Apply'}</button></div>
        </article>)}</div> : <div className="seeker-empty"><BriefcaseBusiness size={23} /><h3>No matching open roles</h3><p>Try a different search or check back for new opportunities.</p></div>}
      </section>}

      {section === 'recommended' && <section className="seeker-section"><div className="seeker-board-heading"><div><span className="seeker-eyebrow">PROFILE-BASED DISCOVERY</span><h1>Recommended for you</h1><p>Recommendations use your listed skills and job preferences. Scores are transparent skill overlap, not hiring decisions.</p></div><button className="seeker-outline-button" onClick={() => setSection('profile')}>Update my profile</button></div>{loading ? <div className="seeker-loading">Updating recommendations…</div> : recommendations.length ? <div className="seeker-job-grid">{recommendations.map((item) => <article className="seeker-job-card" key={item.job.id}><div className="seeker-job-card-top"><span className="seeker-job-icon"><Sparkles size={17} /></span><span className="seeker-match-score">{item.match_percentage}% skill overlap</span></div><h3>{item.job.title}</h3><p className="seeker-company">{item.job.user?.company_name || 'Company not specified'}</p><div className="seeker-reasons">{item.reasons.map((reason) => <p key={reason}><Check size={14} /> {reason}</p>)}</div>{item.missing_skills.length > 0 && <div className="seeker-development"><b>Skills to develop</b><div className="seeker-skill-tags">{item.missing_skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>}<button className="seeker-primary-button seeker-full-button" onClick={() => setSelectedJob(item.job)}>Review role</button></article>)}</div> : <div className="seeker-empty"><Sparkles size={23} /><h3>No recommendations yet</h3><p>Upload a resume or add skills and job preferences to your profile to get relevant suggestions.</p><button className="seeker-primary-button" onClick={() => setSection('profile')}>Complete my profile</button></div>}</section>}

      {section === 'applications' && <section className="seeker-section"><div className="seeker-board-heading"><div><span className="seeker-eyebrow">YOUR JOB SEARCH</span><h1>Applications</h1><p>Track recruiter updates and interview invitations for the jobs you applied to.</p></div><span className="seeker-count-chip">{applications.length} submitted</span></div>{loading ? <div className="seeker-loading">Loading your applications…</div> : applications.length ? <div className="seeker-application-list">{applications.map((application) => <article key={application.id} className="seeker-application-card"><div className="seeker-application-main"><span className="seeker-job-icon"><BriefcaseBusiness size={18} /></span><div><span className={`seeker-status seeker-status-${application.status}`}>{application.status}</span><h3>{application.job?.title || 'Job listing'}</h3><p>{application.job?.user?.company_name || 'Company not specified'}</p><small>Applied {new Date(application.created_at).toLocaleDateString()}</small></div></div><div className="seeker-application-meta">{application.interview_at ? <div className="seeker-interview-detail"><Bell size={15} /><span><b>Interview invitation</b><small>{new Date(application.interview_at).toLocaleString()}</small>{application.interview_notes && <small>{application.interview_notes}</small>}</span></div> : <span className="seeker-pending-copy">Status updates appear here when the recruiter reviews your application.</span>}{application.candidate?.extracted_skills_json?.length > 0 && <small>Resume skills: {application.candidate.extracted_skills_json.slice(0, 4).join(' · ')}</small>}</div></article>)}</div> : <div className="seeker-empty"><FileText size={23} /><h3>No applications yet</h3><p>Browse open opportunities and apply when you find the right fit.</p><button className="seeker-primary-button" onClick={() => setSection('discover')}>Browse jobs</button></div>}</section>}

      {section === 'profile' && <section className="seeker-section"><div className="seeker-board-heading"><div><span className="seeker-eyebrow">YOUR CAREER PROFILE</span><h1>Profile & resume</h1><p>Keep your skills and preferences current to improve your job recommendations.</p></div></div><div className="seeker-profile-layout"><form className="seeker-profile-card" onSubmit={saveProfile}><div className="seeker-profile-title"><span className="seeker-job-icon"><CircleUserRound size={20} /></span><div><h2>Profile details</h2><p>Your details and preferences are visible to you.</p></div></div><label>Full name<input required maxLength="255" value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} /></label><label>Professional headline<input maxLength="255" value={profileForm.headline} onChange={(event) => setProfileForm({ ...profileForm, headline: event.target.value })} placeholder="e.g. Frontend developer" /></label><label>Location<input value={profileForm.location} onChange={(event) => setProfileForm({ ...profileForm, location: event.target.value })} placeholder="City, country" /></label><label>About you<textarea rows="4" maxLength="5000" value={profileForm.bio} onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })} placeholder="Share your experience and career goals" /></label><label>Skills <small>Separate skills with commas</small><input value={profileForm.skills} onChange={(event) => setProfileForm({ ...profileForm, skills: event.target.value })} placeholder="React, SQL, project management" /></label><label>Preferred job titles<input value={profileForm.preferred_job_titles} onChange={(event) => setProfileForm({ ...profileForm, preferred_job_titles: event.target.value })} placeholder="Software engineer, data analyst" /></label><label>Preferred location<input value={profileForm.preferred_location} onChange={(event) => setProfileForm({ ...profileForm, preferred_location: event.target.value })} placeholder="Remote, city, or region" /></label><button className="seeker-primary-button" disabled={busy}>Save profile</button></form>
        <div className="seeker-resume-column"><form className="seeker-profile-card seeker-resume-card" onSubmit={uploadResume}><div className="seeker-profile-title"><span className="seeker-job-icon"><FileText size={19} /></span><div><h2>Resume</h2><p>PDF, DOC, or DOCX · maximum 10 MB</p></div></div><label className="seeker-upload-input">Upload a resume<input type="file" name="resume" required accept=".pdf,.doc,.docx" /></label><p className="seeker-private-note">Your resume is stored privately. Its text is analyzed for job-related skills only.</p><button className="seeker-primary-button" disabled={busy}>Upload and analyze</button>{resume && <div className="seeker-resume-status"><div><b>{resume.status === 'done' ? 'Resume analyzed' : resume.status}</b><small>{new Date(resume.created_at).toLocaleDateString()}</small>{resume.error && <small className="seeker-error-text">{resume.error}</small>}</div><button type="button" aria-label="Download your resume" className="seeker-download" onClick={downloadResume}><ArrowDownToLine size={16} /></button></div>}{resume?.extracted_skills_json?.length > 0 && <div className="seeker-skill-tags">{resume.extracted_skills_json.map((skill) => <span key={skill}>{skill}</span>)}</div>}</form>
          <aside className="seeker-privacy-panel"><UserRound size={18} /><h3>Your review stays human</h3><p>Resume matching uses the skills in your resume and each job’s stated skill requirements. It does not rank candidates using sensitive personal characteristics.</p></aside>
        </div></div></section>}
    </div>
    {selectedJob && <div className="seeker-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedJob(null); }}><section className="seeker-job-modal" role="dialog" aria-modal="true" aria-labelledby="seeker-job-title"><header><div><span className="seeker-eyebrow">OPEN ROLE</span><h2 id="seeker-job-title">{selectedJob.title}</h2><p>{selectedJob.user?.company_name || 'Company not specified'}{selectedJob.experience_requirements ? ` · ${selectedJob.experience_requirements}` : ''}</p></div><button className="seeker-close-button" onClick={() => setSelectedJob(null)} aria-label="Close job details"><X size={19} /></button></header><div className="seeker-modal-body"><h3>Job description</h3><p className="seeker-full-description">{selectedJob.description}</p>{(selectedJob.required_skills_json || []).length > 0 && <><h3>Required skills</h3><div className="seeker-skill-tags">{selectedJob.required_skills_json.map((skill) => <span key={skill}>{skill}</span>)}</div></>}<p className="seeker-decision-note">Matching insights are decision support only and do not guarantee an interview or offer.</p>{!resume && <SeekerNotice>Upload a resume in My profile before you apply.</SeekerNotice>}</div><footer><button className="seeker-outline-button" onClick={() => { setSelectedJob(null); setSection('profile'); }}>Manage resume</button><button className="seeker-primary-button" disabled={busy || appliedJobIds.has(selectedJob.id) || !resume} onClick={() => apply(selectedJob)}>{appliedJobIds.has(selectedJob.id) ? 'Already applied' : busy ? 'Submitting…' : 'Apply with my resume'} <ArrowRight size={15} /></button></footer></section></div>}
  </main>;
}
