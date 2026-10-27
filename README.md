# HireFlow: Job Recruitment and Applicant Tracking System

HireFlow is a role-separated recruitment project with a React/Vite frontend, Laravel 12 REST API, and a Flask resume parsing and matching service. Recruiters and job seekers use separate registration, login, and protected routes over one Laravel Sanctum authentication system and a shared `users` table.

## Architecture

```text
React + Vite (frontend, port 5173)
        | Bearer token API requests
        v
Laravel 12 + Sanctum (backend, port 8000)
        | Private resume storage, applications, and skill comparison
        v
Flask resume parser (optional, port 5001)
```

Laravel stores resume files on its private local disk. Matching is an explainable skill-overlap score: matched listed skills divided by the job's explicit (or recognized) required skills. Job-description text alone can never count a skill as present in a resume. If a job has no skill requirements that can be identified, no score is invented. No sensitive personal characteristics are used to calculate match or recommendation scores. These scores are decision support, not hiring decisions.

No AWS/S3 deployment or credential configuration is present in this repository; AWS hosting is not claimed or required for local development.

## Implemented Features

- Responsive landing page with separate recruiter and job seeker entry points.
- Recruiter registration/login: `/recruiter/register` and `/recruiter/auth`.
- Job seeker registration/login: `/user/register` and `/user/auth`.
- Role-verified dashboards at `/workspace/overview` (recruiter) and `/user/dashboard` (job seeker).
- Protected recruiter workspace with logout and recruiter role navigation.
- Job seeker profile with skills, career preferences, location, and biography.
- Job seeker board with searchable open jobs and complete job descriptions.
- Resume upload, private download, extracted skills, education, and experience details for job seekers.
- Applications submitted with the latest analyzed resume and recruiter-managed status tracking.
- Profile-based job recommendations with actual matched/missing skills and explanations.
- In-app application status updates and recruiter-created interview invitations.
- Dashboard statistics and recent candidate activity from Laravel.
- Recruiter-owned job create, edit, close/open, delete, and search.
- Applicant search, job/status filters, parsed profile details, and secure resume download.
- Recruiter shortlist/reject decisions, interview scheduling, and company profile editing.
- PDF, DOC, and DOCX resume upload (10 MB frontend and backend limit).
- Actual skill-based resume/job match results with matched and missing requirement explanations.
- Loading, validation/API error, success, and empty states.

Recruiter accounts retain the existing `hr` database role; new job seekers receive `job_seeker`. Existing legacy `candidate` accounts are accepted by job seeker login. Roles are assigned by the server, never from submitted form values, and backend middleware restricts recruiter endpoints and applicant resume access. Interview invitations are shown in the job seeker application area; outbound email delivery and admin user management are not implemented.

## Project Structure

```text
frontend/       React + Vite role-based frontend
backend/        Laravel 12 API, Sanctum auth, migrations, and local resume storage
ai_services/    Flask resume parsing and deterministic skill-overlap matching service
```

## Prerequisites

- Windows with XAMPP/PHP 8.2+, Composer, and Node.js/npm.
- A configured database supported by the Laravel `.env` file (the checked-in default configuration should be verified before migrating).
- Python 3.9+ and pip to run the optional Flask parser. Laravel includes a local PDF/DOC/DOCX parser and skills-based matcher as a fallback.

## Run Locally in Your Browser

Follow these steps on Windows. Keep each service running in its own PowerShell terminal. Commands below assume you start in the repository root (`AWS-based-applicant-tracking-system`).

### 1. Start the database

1. Open the XAMPP Control Panel and start **MySQL**.
2. Open `http://localhost/phpmyadmin` and create a database named `resume_ats` (or update `DB_DATABASE` in `backend/.env` to match an existing database).

### 2. Configure and start the Laravel API

Open a PowerShell terminal in the repository root and run:

```powershell
cd backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
composer install
# Run only once when creating a new local .env
php artisan key:generate
```

Check `backend/.env` and set `DB_*` to match your local MySQL configuration. The checked-in defaults use MySQL at `127.0.0.1:3306`, database `resume_ats`, and username `root` with no password. Then, in the same terminal:

```powershell
php artisan migrate --seed
php artisan serve --host 127.0.0.1 --port 8000
```

Leave this terminal open. The API is available at `http://127.0.0.1:8000/api`. Migrations are additive for an existing database; do not use `migrate:fresh` if you need to preserve data. Resume files use Laravel's private local disk.

### 3. Start the React frontend

Open a **second** PowerShell terminal in the repository root and run:

```powershell
cd frontend
npm install
npm run dev
```

Leave this terminal open and open **`http://localhost:5173`** in your browser. Vite serves the frontend and proxies `/api` requests to the Laravel API at `http://127.0.0.1:8000`. If Laravel runs at another address, set `VITE_BACKEND_URL` in the frontend process environment, or set `VITE_API_URL` in `frontend/.env` to the full API URL (for example, `http://127.0.0.1:8000/api`) and allow the frontend origin in Laravel CORS.

The frontend page can load without the API, but sign-in, registration, job data, and other API-backed features require the database and Laravel steps above.

### 4. Create an account and try the app

- Recruiter: open `http://localhost:5173/recruiter/register` to create an account, then sign in at `http://localhost:5173/recruiter/auth`.
- Job seeker: open `http://localhost:5173/user/register` to create an account, then sign in at `http://localhost:5173/user/auth`.
- After sign-in, the backend-returned role selects the destination. A job seeker cannot access recruiter API routes, and a recruiter cannot access the job seeker dashboard.
- Recruiter registration stores the existing `hr` role; job seeker registration stores the `job_seeker` role.
- The `/register` route remains a compatibility redirect to recruiter registration. The previous `/recruiter/login` path redirects to `/recruiter/auth`.

To add 250 clearly labeled open demo jobs after creating at least one recruiter account, open a **third** terminal and run:

```powershell
cd backend
php artisan db:seed --class=DemoJobSeeder
```

The seeder assigns listings to existing recruiter accounts and is safe to rerun without duplicating its demo jobs. It does not create demo login credentials.

### 5. Optional: enable resume parsing and matching

Resume uploads need the Flask service as well. Open another PowerShell terminal in the repository root and run:

```powershell
cd ai_services
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

Confirm the service at `http://127.0.0.1:5001/health`. Set `AI_SERVICE_URL=http://127.0.0.1:5001` in `backend/.env` before starting Laravel. If you change it while Laravel is running, use another terminal, run `cd backend`, then run `php artisan config:clear` and restart the Laravel server. The frontend upload calls Laravel; Laravel stores the resume and invokes the Python service.

### 6. Optional: check the production build

From the repository root, run:

```powershell
cd frontend
npm run build
```

## Backend API Used by the Frontend

- `POST /api/recruiter/register` (legacy alias: `POST /api/register`), `POST /api/recruiter/login`
- `POST /api/user/register`, `POST /api/user/login`
- `GET /api/public/jobs` (open roles only), `GET /api/me`, `POST /api/logout`
- `GET /api/dashboard/stats`
- `GET`, `POST`, `PUT`, `DELETE /api/jobs`
- `GET /api/candidates`, `GET /api/candidates/{candidate}`
- `POST /api/upload-resume`, `GET /api/resumes/{candidate}/status`

Protected routes require `Authorization: Bearer <token>`. Laravel authorizes recruiter endpoints by role and job/candidate ownership. Resume status evaluates the recruiter's open roles and persists match/application records. No applicant-controlled application endpoint is currently defined.

## Configuration and AWS

Frontend configuration may include `VITE_API_URL` or `VITE_BACKEND_URL`. Set `VITE_CONTACT_EMAIL` in `frontend/.env` to a real project contact inbox; the public Contact form opens a prefilled draft in the visitor's default email app and provides a copy-message fallback. It does not send or store messages on the server, and its send action stays disabled until an inbox is configured. These are public endpoint/contact values only; never put credentials or AWS keys in frontend variables. Laravel's `AI_SERVICE_URL` config controls its server-side Flask connection. The repository currently uses Laravel local storage for resumes and has no verified S3/AWS deployment configuration.

For separate frontend/backend origins, configure Laravel CORS to allow the Vite origin (`http://localhost:5173`) and the configured API URL. Bearer tokens are held in browser `sessionStorage` and are removed when signing out; HTTPS is required outside local development.

## Troubleshooting

- **Vite cannot reach Laravel:** confirm `php artisan serve` is running on port 8000 and the Vite proxy target is correct.
- **401 or expired session:** sign in again; the frontend stores only the returned Sanctum token for the current browser session.
- **Resume processing reports no open jobs:** create at least one open job before uploading.
- **Resume processing fails:** open `http://127.0.0.1:5001/health`, verify `AI_SERVICE_URL`, and inspect Laravel logs under `backend/storage/logs`.
- **Database connection fails:** verify `DB_*` in `backend/.env` and that the database service is running before migration.
- **Model availability:** the transformer model may need network access on first use; matching can fall back to TF-IDF.

## Verification

The React production build is checked with `cd frontend; npm run build`. Laravel tests can be run with `cd backend; php artisan test`. A complete end-to-end demonstration requires a running database, Laravel API, and Python service; AWS is not required.