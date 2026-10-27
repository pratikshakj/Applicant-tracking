import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, Award, Bell, BriefcaseBusiness, Calendar, CalendarDays, Check,
  CheckCircle2, ChevronRight, CircleDot, CircleUserRound, Clock, ExternalLink,
  FileCheck, FileText, Filter, GraduationCap, Info, LogOut, MapPin, Search,
  Sparkles, Upload, UserRound, X, XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { JOB_DEPARTMENTS } from './jobOptions.js';

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
  const applicationsRef = useRef([]);
  const [profile, setProfile] = useState(null);
  const [resume, setResume] = useState(null);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [appFilter, setAppFilter] = useState('all'); // 'all' | 'interview' | 'shortlisted' | 'applied' | 'rejected'
  const [appSearch, setAppSearch] = useState('');
  const [applyMode, setApplyMode] = useState('profile'); // 'profile' | 'upload'
  const [applyFile, setApplyFile] = useState(null);
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
      applicationsRef.current = applicationData.applications || [];
      setApplications(applicationsRef.current);
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
  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const result = await seekerApi('/user/applications');
        const next = result.applications || [];
        const previousById = new Map(applicationsRef.current.map((item) => [item.id, item]));
        const updated = next.find((item) => {
          const previous = previousById.get(item.id);
          return previous && (previous.status !== item.status || previous.interview_at !== item.interview_at);
        });
        if (updated) {
          const jobTitle = updated.job?.title || 'your application';
          if (updated.status === 'rejected') setNotice(`Update: your application for ${jobTitle} was declined.`);
          else if (updated.interview_at) setNotice(`Update: you are shortlisted for ${jobTitle}. Interview scheduled for ${new Date(updated.interview_at).toLocaleString()}.`);
          else if (updated.status === 'shortlisted') setNotice(`Update: you have been shortlisted for ${jobTitle}.`);
        }
        applicationsRef.current = next;
        setApplications(next);
      } catch (requestError) {
        setError(requestError.message);
      }
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const appliedJobIds = useMemo(() => new Set(applications.map((application) => application.job_id)), [applications]);
  const filteredJobs = jobs.filter((job) => (!department || job.department === department) && `${job.title} ${job.department || ''} ${job.user?.company_name || ''} ${(job.required_skills_json || []).join(' ')} ${job.description}`.toLowerCase().includes(search.toLowerCase()));
  const upcomingInterviews = applications.filter((application) => application.interview_at && new Date(application.interview_at) >= new Date());

  const openApplyModal = (job) => {
    setSelectedJob(job);
    // If user has a profile resume, default to profile; otherwise default to upload
    setApplyMode(resume ? 'profile' : 'upload');
    setApplyFile(null);
  };

  const apply = async (job) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (applyMode === 'upload') {
        if (!applyFile) {
          setError('Please select a resume file (PDF, DOC, DOCX) to upload.');
          setBusy(false);
          return;
        }
        const formData = new FormData();
        formData.append('resume', applyFile);
        await seekerApi(`/user/jobs/${job.id}/apply`, {
          method: 'POST',
          body: formData,
        });
      } else {
        if (!resume) {
          setError('No resume found on your profile. Please upload a resume first or choose the upload option.');
          setBusy(false);
          return;
        }
        await seekerApi(`/user/jobs/${job.id}/apply`, { method: 'POST' });
      }

      setNotice(`Your application for ${job.title} was submitted successfully.`);
      setSelectedJob(null);
      setApplyFile(null);
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
        <div className="seeker-job-filters"><label className="seeker-search seeker-search-pro"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search job title, company, description, or skill" /></label><label className="seeker-department-filter">Department<select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">All departments</option>{JOB_DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>
        {loading ? <div className="seeker-loading">Loading open roles…</div> : filteredJobs.length ? <div className="seeker-job-grid">{filteredJobs.map((job) => <article className="seeker-job-card" key={job.id}>
          <div className="seeker-job-card-top"><span className="seeker-job-icon"><BriefcaseBusiness size={18} /></span><span className="seeker-open-tag">OPEN</span></div>
          <h3>{job.title}</h3><p className="seeker-company">{job.department || 'Other'} · {job.employment_type || 'Full-time'} · {job.user?.company_name || 'Company not specified'}</p>
          <p className="seeker-job-copy">{job.description}</p>
          {job.experience_requirements && <p className="seeker-exp"><Check size={13} /> {job.experience_requirements}</p>}
          <div className="seeker-skill-tags">{(job.required_skills_json || []).slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}</div>
          <div className="seeker-job-card-actions"><button className="seeker-link-button" onClick={() => openApplyModal(job)}>View details <ArrowRight size={14} /></button><button className="seeker-primary-button" disabled={appliedJobIds.has(job.id)} onClick={() => openApplyModal(job)}>{appliedJobIds.has(job.id) ? 'Applied' : 'Apply'}</button></div>
        </article>)}</div> : <div className="seeker-empty"><BriefcaseBusiness size={23} /><h3>No matching open roles</h3><p>Try a different search or check back for new opportunities.</p></div>}
      </section>}

      {section === 'recommended' && <section className="seeker-section"><div className="seeker-board-heading"><div><span className="seeker-eyebrow">PROFILE-BASED DISCOVERY</span><h1>Recommended for you</h1><p>Recommendations use your listed skills and job preferences. Scores are transparent skill overlap, not hiring decisions.</p></div><button className="seeker-outline-button" onClick={() => setSection('profile')}>Update my profile</button></div>{loading ? <div className="seeker-loading">Updating recommendations…</div> : recommendations.length ? <div className="seeker-job-grid">{recommendations.map((item) => <article className="seeker-job-card" key={item.job.id}><div className="seeker-job-card-top"><span className="seeker-job-icon"><Sparkles size={17} /></span><span className="seeker-match-score">{item.match_percentage}% skill overlap</span></div><h3>{item.job.title}</h3><p className="seeker-company">{item.job.user?.company_name || 'Company not specified'}</p><div className="seeker-reasons">{item.reasons.map((reason) => <p key={reason}><Check size={14} /> {reason}</p>)}</div>{item.missing_skills.length > 0 && <div className="seeker-development"><b>Skills to develop</b><div className="seeker-skill-tags">{item.missing_skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>}<button className="seeker-primary-button seeker-full-button" onClick={() => openApplyModal(item.job)}>Review role</button></article>)}</div> : <div className="seeker-empty"><Sparkles size={23} /><h3>No recommendations yet</h3><p>Upload a resume or add skills and job preferences to your profile to get relevant suggestions.</p><button className="seeker-primary-button" onClick={() => setSection('profile')}>Complete my profile</button></div>}</section>}

      {section === 'applications' && <section className="seeker-section">
        <div className="seeker-board-heading">
          <div>
            <span className="seeker-eyebrow">YOUR JOB SEARCH</span>
            <h1>My Applications</h1>
            <p>Track your submissions, real-time interview invitations, and employer updates.</p>
          </div>
          <span className="seeker-count-chip">{applications.length} submitted</span>
        </div>

        {/* Application Metrics Summary Cards */}
        {applications.length > 0 && (
          <div className="app-stats-grid">
            <div className={`app-stat-card ${appFilter === 'all' ? 'active' : ''}`} onClick={() => setAppFilter('all')}>
              <div className="app-stat-icon total-icon"><FileText size={18} /></div>
              <div className="app-stat-info">
                <span>Total Applications</span>
                <strong>{applications.length}</strong>
              </div>
            </div>
            <div className={`app-stat-card ${appFilter === 'interview' ? 'active' : ''}`} onClick={() => setAppFilter('interview')}>
              <div className="app-stat-icon interview-icon"><CalendarDays size={18} /></div>
              <div className="app-stat-info">
                <span>Interviews Scheduled</span>
                <strong>{applications.filter((a) => a.status === 'interview' || Boolean(a.interview_at)).length}</strong>
              </div>
            </div>
            <div className={`app-stat-card ${appFilter === 'shortlisted' ? 'active' : ''}`} onClick={() => setAppFilter('shortlisted')}>
              <div className="app-stat-icon shortlisted-icon"><CheckCircle2 size={18} /></div>
              <div className="app-stat-info">
                <span>Shortlisted</span>
                <strong>{applications.filter((a) => a.status === 'shortlisted' && !a.interview_at).length}</strong>
              </div>
            </div>
            <div className={`app-stat-card ${appFilter === 'applied' ? 'active' : ''}`} onClick={() => setAppFilter('applied')}>
              <div className="app-stat-icon pending-icon"><Clock size={18} /></div>
              <div className="app-stat-info">
                <span>In Review</span>
                <strong>{applications.filter((a) => a.status === 'applied').length}</strong>
              </div>
            </div>
            <div className={`app-stat-card ${appFilter === 'rejected' ? 'active' : ''}`} onClick={() => setAppFilter('rejected')}>
              <div className="app-stat-icon rejected-icon"><XCircle size={18} /></div>
              <div className="app-stat-info">
                <span>Declined</span>
                <strong>{applications.filter((a) => a.status === 'rejected').length}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        {applications.length > 0 && (
          <div className="app-toolbar">
            <div className="app-search-wrap">
              <Search size={16} />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search by job title, company, or skills..."
              />
              {appSearch && <button className="clear-search-btn" onClick={() => setAppSearch('')}><X size={14} /></button>}
            </div>

            <div className="app-filter-pills">
              <button
                className={`app-pill ${appFilter === 'all' ? 'active' : ''}`}
                onClick={() => setAppFilter('all')}
              >
                All ({applications.length})
              </button>
              <button
                className={`app-pill ${appFilter === 'interview' ? 'active' : ''}`}
                onClick={() => setAppFilter('interview')}
              >
                Interviews ({applications.filter((a) => a.status === 'interview' || Boolean(a.interview_at)).length})
              </button>
              <button
                className={`app-pill ${appFilter === 'shortlisted' ? 'active' : ''}`}
                onClick={() => setAppFilter('shortlisted')}
              >
                Shortlisted ({applications.filter((a) => a.status === 'shortlisted' && !a.interview_at).length})
              </button>
              <button
                className={`app-pill ${appFilter === 'applied' ? 'active' : ''}`}
                onClick={() => setAppFilter('applied')}
              >
                In Review ({applications.filter((a) => a.status === 'applied').length})
              </button>
              <button
                className={`app-pill ${appFilter === 'rejected' ? 'active' : ''}`}
                onClick={() => setAppFilter('rejected')}
              >
                Declined ({applications.filter((a) => a.status === 'rejected').length})
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="seeker-loading">Loading your applications…</div>
        ) : !applications.length ? (
          <div className="seeker-empty">
            <FileText size={28} />
            <h3>No applications submitted yet</h3>
            <p>Browse open opportunities, match your skills, and apply directly.</p>
            <button className="seeker-primary-button" onClick={() => setSection('discover')}>
              Browse jobs <ArrowRight size={15} />
            </button>
          </div>
        ) : (
          (() => {
            const filteredApps = applications.filter((app) => {
              // Status filter
              if (appFilter === 'interview' && app.status !== 'interview' && !app.interview_at) return false;
              if (appFilter === 'shortlisted' && (app.status !== 'shortlisted' || app.interview_at)) return false;
              if (appFilter === 'applied' && app.status !== 'applied') return false;
              if (appFilter === 'rejected' && app.status !== 'rejected') return false;

              // Text search filter
              if (appSearch) {
                const query = appSearch.toLowerCase();
                const title = (app.job?.title || '').toLowerCase();
                const company = (app.job?.user?.company_name || '').toLowerCase();
                const skills = (app.candidate?.extracted_skills_json || []).join(' ').toLowerCase();
                return title.includes(query) || company.includes(query) || skills.includes(query);
              }
              return true;
            });

            if (!filteredApps.length) {
              return (
                <div className="seeker-empty app-filter-empty">
                  <Filter size={24} />
                  <h3>No applications match this filter</h3>
                  <p>Try selecting a different status filter or clearing your search term.</p>
                  <button className="seeker-outline-button" onClick={() => { setAppFilter('all'); setAppSearch(''); }}>
                    Show all applications
                  </button>
                </div>
              );
            }

            return (
              <div className="seeker-application-list">
                {filteredApps.map((application) => {
                  const isInterview = application.status === 'interview' || Boolean(application.interview_at);
                  const isShortlisted = application.status === 'shortlisted' && !application.interview_at;
                  const isRejected = application.status === 'rejected';
                  const isApplied = application.status === 'applied';

                  return (
                    <article key={application.id} className={`seeker-application-card enhanced-app-card ${isInterview ? 'card-interview' : isShortlisted ? 'card-shortlisted' : isRejected ? 'card-rejected' : ''}`}>
                      <div className="seeker-application-main">
                        <span className={`app-type-icon ${isInterview ? 'icon-interview' : isShortlisted ? 'icon-shortlisted' : isRejected ? 'icon-rejected' : 'icon-applied'}`}>
                          {isInterview ? <CalendarDays size={20} /> : isShortlisted ? <CheckCircle2 size={20} /> : isRejected ? <XCircle size={20} /> : <BriefcaseBusiness size={20} />}
                        </span>
                        <div className="app-main-details">
                          <div className="app-status-badge-row">
                            <span className={`seeker-status seeker-status-${application.status}`}>
                              {isInterview ? 'Interview Scheduled' : isShortlisted ? 'Shortlisted' : isRejected ? 'Declined' : 'In Review'}
                            </span>
                            <span className="app-date-chip">
                              <Clock size={11} /> Applied {new Date(application.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <h3>{application.job?.title || 'Job listing'}</h3>
                          <p className="app-company-line">
                            <b>{application.job?.user?.company_name || 'Hiring Company'}</b>
                            {application.job?.department && <span> · {application.job.department}</span>}
                            {application.job?.employment_type && <span> · {application.job.employment_type}</span>}
                            {application.job?.user?.location && <span> · <MapPin size={11} /> {application.job.user.location}</span>}
                          </p>

                          {/* Progress Stepper for Application Lifecycle */}
                          <div className="app-progress-stepper">
                            <div className={`step-item completed`}>
                              <span className="step-circle"><Check size={10} /></span>
                              <span className="step-label">Applied</span>
                            </div>
                            <div className={`step-line ${!isApplied ? 'active' : ''}`} />
                            <div className={`step-item ${isShortlisted || isInterview ? 'completed' : isApplied ? 'current' : 'disabled'}`}>
                              <span className="step-circle">{isShortlisted || isInterview ? <Check size={10} /> : '2'}</span>
                              <span className="step-label">Review</span>
                            </div>
                            <div className={`step-line ${isInterview || (isShortlisted && !isRejected) ? 'active' : ''}`} />
                            <div className={`step-item ${isInterview ? 'completed highlight-interview' : isRejected ? 'failed' : 'disabled'}`}>
                              <span className="step-circle">{isInterview ? <CalendarDays size={10} /> : isRejected ? '✕' : '3'}</span>
                              <span className="step-label">{isRejected ? 'Decision' : 'Interview'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="seeker-application-meta app-right-meta">
                        {isRejected ? (
                          <div className="seeker-interview-detail is-declined-detail">
                            <Bell size={16} />
                            <div>
                              <b>Application Closed</b>
                              <small>The employer decided not to proceed with this application at this time.</small>
                            </div>
                          </div>
                        ) : isInterview ? (
                          <div className="seeker-interview-detail is-active-interview">
                            <CalendarDays size={18} />
                            <div>
                              <b>Upcoming Interview</b>
                              <small className="interview-datetime">
                                📅 {new Date(application.interview_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                              </small>
                              {application.interview_notes && (
                                <p className="interview-notes-box">
                                  <b>Instructions / Link:</b> {application.interview_notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : isShortlisted ? (
                          <div className="seeker-interview-detail is-shortlisted-detail">
                            <CheckCircle2 size={16} />
                            <div>
                              <b>You have been shortlisted!</b>
                              <small>The hiring team approved your profile. They will contact you or schedule an interview soon.</small>
                            </div>
                          </div>
                        ) : (
                          <div className="seeker-interview-detail is-pending-detail">
                            <Clock size={16} />
                            <div>
                              <b>Under Review</b>
                              <small>Your resume and application details are currently with the recruiting team.</small>
                            </div>
                          </div>
                        )}

                        {application.candidate?.extracted_skills_json?.length > 0 && (
                          <div className="app-matched-skills-preview">
                            <span className="meta-skills-title">Resume Skills Attached:</span>
                            <div className="seeker-skill-tags">
                              {application.candidate.extracted_skills_json.slice(0, 4).map((skill) => (
                                <span key={skill}>{skill}</span>
                              ))}
                              {application.candidate.extracted_skills_json.length > 4 && (
                                <span className="more-skills-tag">+{application.candidate.extracted_skills_json.length - 4} more</span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="app-card-actions">
                          <button
                            type="button"
                            className="seeker-link-button app-details-btn"
                            onClick={() => setSelectedApplication(application)}
                          >
                            View details & history <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            );
          })()
        )}
      </section>}

      {section === 'profile' && <section className="seeker-section">
        <div className="seeker-board-heading">
          <div>
            <span className="seeker-eyebrow">YOUR CAREER PROFILE</span>
            <h1>Profile & resume summary</h1>
            <p>Keep your profile details and resume up-to-date to get tailored recommendations and faster applications.</p>
          </div>
        </div>

        {/* Profile Summary Header Card */}
        <div className="profile-summary-hero">
          <div className="profile-hero-avatar">
            {(profile?.name || user.name).split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
          </div>
          <div className="profile-hero-info">
            <div className="profile-hero-top">
              <h2>{profile?.name || user.name}</h2>
              <span className="profile-role-badge">Job Seeker</span>
            </div>
            <p className="profile-hero-headline">{profile?.headline || 'No headline set — add one in profile details below'}</p>
            <div className="profile-hero-meta">
              <span><MapPin size={13} /> {profile?.location || 'Location not specified'}</span>
              <span><FileText size={13} /> {user.email}</span>
              {resume && <span className="profile-hero-resume-tag"><FileCheck size={13} /> Resume on file ({new Date(resume.created_at).toLocaleDateString()})</span>}
            </div>
          </div>
        </div>

        {/* Profile Resume Intelligence / Parsed Highlights Banner */}
        {resume && (
          <div className="profile-intelligence-card">
            <div className="profile-intel-header">
              <div className="profile-intel-title">
                <span className="intel-sparkle-icon"><Sparkles size={17} /></span>
                <div>
                  <h3>Resume Intelligence & Parsed Highlights</h3>
                  <small>Extracted directly from your active resume: <b>{resume.parsed_name || user.name}</b></small>
                </div>
              </div>
              <div className="profile-intel-actions">
                <button type="button" className="seeker-download-btn" onClick={downloadResume}>
                  <ArrowDownToLine size={14} /> Download current resume
                </button>
              </div>
            </div>

            <div className="profile-intel-grid">
              <div className="profile-intel-block">
                <h4><Award size={14} /> Extracted Skills ({resume.extracted_skills_json?.length || 0})</h4>
                <div className="seeker-skill-tags">
                  {resume.extracted_skills_json?.length > 0
                    ? resume.extracted_skills_json.map((skill) => <span key={skill}>{skill}</span>)
                    : <span className="muted-text">No skills extracted yet</span>}
                </div>
              </div>

              {resume.parsed_experience_json?.length > 0 && (
                <div className="profile-intel-block">
                  <h4><BriefcaseBusiness size={14} /> Parsed Experience</h4>
                  <ul className="profile-parsed-list">
                    {resume.parsed_experience_json.map((item, idx) => (
                      <li key={idx}>
                        <b>{item.title || item.role || item.company || 'Role / Project'}</b>
                        {item.duration && <span> ({item.duration})</span>}
                        {item.summary && <p>{item.summary}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {resume.parsed_education_json?.length > 0 && (
                <div className="profile-intel-block">
                  <h4><GraduationCap size={14} /> Parsed Education</h4>
                  <ul className="profile-parsed-list">
                    {resume.parsed_education_json.map((item, idx) => (
                      <li key={idx}>
                        <b>{item.degree || item.institution || 'Degree / Institution'}</b>
                        {item.year && <span> ({item.year})</span>}
                        {item.summary && <p>{item.summary}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="seeker-profile-layout">
          <form className="seeker-profile-card" onSubmit={saveProfile}>
            <div className="seeker-profile-title">
              <span className="seeker-job-icon"><CircleUserRound size={20} /></span>
              <div>
                <h2>Edit profile details</h2>
                <p>Personal information, skills, and target job roles.</p>
              </div>
            </div>

            <label>
              Full name
              <input required maxLength="255" value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} />
            </label>

            <label>
              Professional headline
              <input maxLength="255" value={profileForm.headline} onChange={(event) => setProfileForm({ ...profileForm, headline: event.target.value })} placeholder="e.g. Senior Frontend Developer | React & TypeScript" />
            </label>

            <label>
              Location
              <input value={profileForm.location} onChange={(event) => setProfileForm({ ...profileForm, location: event.target.value })} placeholder="City, country or Remote" />
            </label>

            <label>
              About you
              <textarea rows="4" maxLength="5000" value={profileForm.bio} onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })} placeholder="Share your experience, achievements, and career goals" />
            </label>

            <label>
              Skills <small>Separate skills with commas</small>
              <input value={profileForm.skills} onChange={(event) => setProfileForm({ ...profileForm, skills: event.target.value })} placeholder="React, SQL, TypeScript, GraphQL, UI Design" />
            </label>

            <label>
              Preferred job titles
              <input value={profileForm.preferred_job_titles} onChange={(event) => setProfileForm({ ...profileForm, preferred_job_titles: event.target.value })} placeholder="Software engineer, frontend engineer, product designer" />
            </label>

            <label>
              Preferred location
              <input value={profileForm.preferred_location} onChange={(event) => setProfileForm({ ...profileForm, preferred_location: event.target.value })} placeholder="Remote, Hybrid, or specific cities" />
            </label>

            <button className="seeker-primary-button" disabled={busy}>Save profile details</button>
          </form>

          <div className="seeker-resume-column">
            <form className="seeker-profile-card seeker-resume-card" onSubmit={uploadResume}>
              <div className="seeker-profile-title">
                <span className="seeker-job-icon"><FileText size={19} /></span>
                <div>
                  <h2>Upload new resume</h2>
                  <p>PDF, DOC, or DOCX · maximum 10 MB</p>
                </div>
              </div>

              <label className="seeker-upload-input">
                Select resume file
                <input type="file" name="resume" required accept=".pdf,.doc,.docx" />
              </label>

              <p className="seeker-private-note">Your resume is parsed locally for skills and experience matching. You can also replace it anytime.</p>

              <button className="seeker-primary-button" disabled={busy}>Upload and analyze</button>

              {resume && (
                <div className="seeker-resume-status">
                  <div>
                    <b>{resume.status === 'done' ? '✓ Resume parsed & active' : resume.status}</b>
                    <small>Uploaded {new Date(resume.created_at).toLocaleDateString()}</small>
                    {resume.error && <small className="seeker-error-text">{resume.error}</small>}
                  </div>
                  <button type="button" aria-label="Download your resume" className="seeker-download" onClick={downloadResume} title="Download resume">
                    <ArrowDownToLine size={16} />
                  </button>
                </div>
              )}
            </form>

            <aside className="seeker-privacy-panel">
              <UserRound size={18} />
              <h3>Transparent & Human-Centered</h3>
              <p>Resume matching uses the skills found in your resume and matching open role requirements. It never filters candidates on sensitive personal characteristics.</p>
            </aside>
          </div>
        </div>
      </section>}
    </div>
    {selectedJob && (
      <div className="seeker-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedJob(null); }}>
        <section className="seeker-job-modal" role="dialog" aria-modal="true" aria-labelledby="seeker-job-title">
          <header>
            <div>
              <span className="seeker-eyebrow">OPEN ROLE</span>
              <h2 id="seeker-job-title">{selectedJob.title}</h2>
              <p>{selectedJob.user?.company_name || 'Company not specified'}{selectedJob.experience_requirements ? ` · ${selectedJob.experience_requirements}` : ''}</p>
            </div>
            <button className="seeker-close-button" onClick={() => setSelectedJob(null)} aria-label="Close job details"><X size={19} /></button>
          </header>

          <div className="seeker-modal-body">
            <h3>Job description</h3>
            <p className="seeker-full-description">{selectedJob.description}</p>
            {(selectedJob.required_skills_json || []).length > 0 && (
              <>
                <h3>Required skills</h3>
                <div className="seeker-skill-tags">
                  {selectedJob.required_skills_json.map((skill) => <span key={skill}>{skill}</span>)}
                </div>
              </>
            )}

            {/* Application Method Selection */}
            <div className="apply-options-container">
              <span className="apply-section-title">CHOOSE HOW TO APPLY</span>

              <div className="apply-options-grid">
                {/* Option 1: Profile Resume */}
                <label className={`apply-option-card ${!resume ? 'is-disabled' : ''} ${applyMode === 'profile' && resume ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="apply_mode"
                    value="profile"
                    disabled={!resume}
                    checked={applyMode === 'profile' && Boolean(resume)}
                    onChange={() => setApplyMode('profile')}
                  />
                  <div className="apply-option-content">
                    <div className="apply-option-header">
                      <FileCheck size={16} />
                      <b>Apply with profile resume</b>
                      {!resume && <span className="option-badge disabled-badge">No resume on profile</span>}
                    </div>
                    {resume ? (
                      <p>Use existing parsed resume: <strong>{resume.parsed_name || user.name}</strong> ({new Date(resume.created_at).toLocaleDateString()})</p>
                    ) : (
                      <p className="option-disabled-text">Initially disabled because no resume is uploaded in your profile.</p>
                    )}
                  </div>
                </label>

                {/* Option 2: Upload Resume Directly */}
                <label className={`apply-option-card ${applyMode === 'upload' ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="apply_mode"
                    value="upload"
                    checked={applyMode === 'upload'}
                    onChange={() => setApplyMode('upload')}
                  />
                  <div className="apply-option-content">
                    <div className="apply-option-header">
                      <Upload size={16} />
                      <b>Upload resume & apply</b>
                      <span className="option-badge available-badge">Available anytime</span>
                    </div>
                    <p>Upload a new PDF, DOC, or DOCX resume specifically for this application.</p>
                  </div>
                </label>
              </div>

              {/* Dedicated Upload File Input when Upload Mode is active */}
              {applyMode === 'upload' && (
                <div className="apply-upload-field">
                  <label className="seeker-upload-input apply-file-picker">
                    <Upload size={16} />
                    <span>{applyFile ? <b>Selected: {applyFile.name} ({(applyFile.size / 1024 / 1024).toFixed(2)} MB)</b> : 'Click or drop a PDF, DOC, or DOCX resume here (max 10 MB)'}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setApplyFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              )}
            </div>

            <p className="seeker-decision-note">Matching insights are decision support only and do not guarantee an interview or offer.</p>
          </div>

          <footer>
            <button className="seeker-outline-button" onClick={() => { setSelectedJob(null); setSection('profile'); }}>
              Manage profile & resume
            </button>
            <button
              className="seeker-primary-button"
              disabled={
                busy ||
                appliedJobIds.has(selectedJob.id) ||
                (applyMode === 'profile' && !resume) ||
                (applyMode === 'upload' && !applyFile)
              }
              onClick={() => apply(selectedJob)}
            >
              {appliedJobIds.has(selectedJob.id)
                ? 'Already applied'
                : busy
                ? 'Submitting…'
                : applyMode === 'upload'
                ? 'Upload & Submit Application'
                : 'Apply with Profile Resume'}{' '}
              <ArrowRight size={15} />
            </button>
          </footer>
        </section>
      </div>
    )}

    {/* Dedicated Application Details Modal */}
    {selectedApplication && (
      <div className="seeker-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedApplication(null); }}>
        <section className="seeker-job-modal app-details-modal" role="dialog" aria-modal="true" aria-labelledby="app-modal-title">
          <header>
            <div>
              <span className="seeker-eyebrow">APPLICATION OVERVIEW</span>
              <h2 id="app-modal-title">{selectedApplication.job?.title || 'Application'}</h2>
              <p>{selectedApplication.job?.user?.company_name || 'Hiring Company'} · Applied on {new Date(selectedApplication.created_at).toLocaleDateString()}</p>
            </div>
            <button className="seeker-close-button" onClick={() => setSelectedApplication(null)} aria-label="Close application details"><X size={19} /></button>
          </header>

          <div className="seeker-modal-body">
            {/* Status Highlight Banner */}
            <div className={`app-modal-banner banner-${selectedApplication.status}`}>
              <div className="banner-icon">
                {selectedApplication.status === 'interview' || selectedApplication.interview_at ? <CalendarDays size={22} /> : selectedApplication.status === 'shortlisted' ? <CheckCircle2 size={22} /> : selectedApplication.status === 'rejected' ? <XCircle size={22} /> : <Clock size={22} />}
              </div>
              <div className="banner-content">
                <h4>
                  {selectedApplication.status === 'interview' || selectedApplication.interview_at
                    ? 'Interview Scheduled'
                    : selectedApplication.status === 'shortlisted'
                    ? 'Application Shortlisted'
                    : selectedApplication.status === 'rejected'
                    ? 'Application Declined'
                    : 'Application In Review'}
                </h4>
                {selectedApplication.interview_at ? (
                  <p>
                    <b>Scheduled Time:</b> {new Date(selectedApplication.interview_at).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                ) : selectedApplication.status === 'shortlisted' ? (
                  <p>You have been shortlisted! The recruiter has flagged your application for next steps.</p>
                ) : selectedApplication.status === 'rejected' ? (
                  <p>Thank you for applying. While this position won't move forward, keep exploring other opportunities.</p>
                ) : (
                  <p>Your application was received by the employer and is currently being evaluated.</p>
                )}
                {selectedApplication.interview_notes && (
                  <div className="modal-interview-instructions">
                    <b>Meeting Link & Notes:</b>
                    <p>{selectedApplication.interview_notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Role Summary */}
            {selectedApplication.job?.description && (
              <div className="app-modal-section">
                <h3>About the Role</h3>
                <p className="seeker-full-description">{selectedApplication.job.description}</p>
              </div>
            )}

            {/* Skills Matched from attached candidate */}
            {selectedApplication.candidate?.extracted_skills_json?.length > 0 && (
              <div className="app-modal-section">
                <h3>Skills on Attached Resume</h3>
                <div className="seeker-skill-tags">
                  {selectedApplication.candidate.extracted_skills_json.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Requirements */}
            {selectedApplication.job?.required_skills_json?.length > 0 && (
              <div className="app-modal-section">
                <h3>Job Required Skills</h3>
                <div className="seeker-skill-tags">
                  {selectedApplication.job.required_skills_json.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <footer>
            <button className="seeker-outline-button" onClick={() => setSelectedApplication(null)}>
              Close
            </button>
          </footer>
        </section>
      </div>
    )}
  </main>;
}
