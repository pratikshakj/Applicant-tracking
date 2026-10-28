# HireFlow — AI-Powered Job Recruitment & Applicant Tracking System

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Laravel](https://img.shields.io/badge/Backend-Laravel%2012%20REST%20API-ff2d20?logo=laravel&logoColor=white)](https://laravel.com/)
[![Sanctum](https://img.shields.io/badge/Auth-Laravel%20Sanctum-red)](https://laravel.com/docs/sanctum)
[![Python](https://img.shields.io/badge/AI%20Service-Python%20%2B%20Flask-3776ab?logo=python&logoColor=white)](https://flask.palletsprojects.com/)
[![AWS](https://img.shields.io/badge/Cloud-AWS%20(EC2%20%7C%20RDS%20%7C%20S3)-ff9900?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Database](https://img.shields.io/badge/Database-MySQL-4479a1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**HireFlow** is a modern, role-separated recruitment platform and Applicant Tracking System (ATS). It connects hiring teams and candidates through dedicated workspaces: **Recruiters** manage job postings, parse candidate resumes, and track applicants with automated screening scores, while **Job Seekers** discover openings with interactive analytics, upload resumes for skill extraction, and track applications through interview and offer stages.

---

## 📑 Table of Contents

1. [⚡ Quickstart: Local Setup Guide](#-quickstart-local-setup-guide)
2. [📸 Application Preview & Screenshots](#-application-preview--screenshots)
3. [☁️ Complete AWS Production Deployment Guide (Beginner Friendly)](#️-complete-aws-production-deployment-guide-beginner-friendly)
   - [AWS Architecture Overview](#1-aws-cloud-architecture-overview)
   - [Phase 1: IAM User & Security Credentials](#phase-1-iam-user--security-credentials)
   - [Phase 2: Amazon S3 Buckets Setup (Resumes & Backups)](#phase-2-create-amazon-s3-buckets)
   - [Phase 3: Amazon RDS (MySQL Database) Setup](#phase-3-create-and-configure-amazon-rds-mysql)
   - [Phase 4: Launch and Configure Amazon EC2 Instance](#phase-4-launch-and-configure-amazon-ec2-instance)
   - [Phase 5: Server Environment Installation on EC2](#phase-5-install-server-environment-on-ec2)
   - [Phase 6: Deploy HireFlow Application to EC2](#phase-6-deploy-hireflow-code-to-ec2)
   - [Phase 7: Store Uploaded Files in Amazon S3](#phase-7-store-uploaded-files-in-amazon-s3)
   - [Phase 8: Automated RDS Database Backups to Amazon S3](#phase-8-automated-rds-database-backups-to-amazon-s3)
   - [Phase 9: Free SSL Certificate (HTTPS) with Certbot](#phase-9-free-ssl-certificate-https-with-certbot)
4. [🏗️ System Architecture](#️-system-architecture)
5. [🚀 Key Features](#-key-features)
6. [🤖 Explainable AI Matching Algorithm](#-explainable-ai-matching-algorithm)
7. [🔌 API Endpoints Reference](#-api-endpoints-reference)
8. [📂 Project Directory Structure](#-project-directory-structure)
9. [🛠️ Troubleshooting & FAQs](#️-troubleshooting--faqs)

---

## ⚡ Quickstart: Local Setup Guide

Follow these step-by-step instructions to get HireFlow running on your local machine.

### 📋 Prerequisites

Ensure you have the following installed before starting:
- **PHP 8.2 or higher** ([Download PHP](https://windows.php.net/download/) or install via [XAMPP](https://www.apachefriends.org/))
- **Composer 2.x** ([Download Composer](https://getcomposer.org/))
- **Node.js (v18+) & npm** ([Download Node.js](https://nodejs.org/))
- **MySQL 8.0+ / MariaDB** (bundled with XAMPP)
- **Python 3.9+ & pip** ([Download Python](https://www.python.org/))
- **Git** ([Download Git](https://git-scm.com/))

---

### Step 1: Database Setup (MySQL)

1. Open the **XAMPP Control Panel** and start **MySQL** (and **Apache** if using phpMyAdmin).
2. Open your browser and navigate to `http://localhost/phpmyadmin`.
3. Create a new database named **`resume_ats`** with collation `utf8mb4_unicode_ci`:
   ```sql
   CREATE DATABASE IF NOT EXISTS resume_ats CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

---

### Step 2: Backend Setup (Laravel 12 API)

Open a **PowerShell** or terminal window in the project root (`c:\xampp\htdocs\Applicant tracking`):

```powershell
# 1. Navigate to the backend directory
cd backend

# 2. Copy the environment configuration file
if (-not (Test-Path .env)) { Copy-Item .env.example .env }

# 3. Install PHP dependencies
composer install

# 4. Generate the application encryption key
php artisan key:generate

# 5. Verify database credentials in backend/.env:
#    DB_CONNECTION=mysql
#    DB_HOST=127.0.0.1
#    DB_PORT=3306
#    DB_DATABASE=resume_ats
#    DB_USERNAME=root
#    DB_PASSWORD=

# 6. Run database migrations and base seeders
php artisan migrate --seed

# 7. Start the Laravel development server
php artisan serve --host 127.0.0.1 --port 8000
```

> 🟢 **Backend status:** The API will be available at `http://127.0.0.1:8000/api`. Keep this terminal open.

---

### Step 3: Frontend Setup (React 18 + Vite)

Open a **second** terminal window in the project root:

```powershell
# 1. Navigate to the frontend directory
cd frontend

# 2. Copy the environment configuration file (optional, defaults work out-of-the-box)
if (-not (Test-Path .env)) { Copy-Item .env.example .env }

# 3. Install npm dependencies
npm install

# 4. Start Vite development server
npm run dev
```

> 🟢 **Frontend status:** Vite serves the frontend at **`http://localhost:5173`** and proxies `/api` calls directly to `http://127.0.0.1:8000`. Keep this terminal open.

---

### Step 4: AI Resume Parsing Microservice (Python Flask)

The Python service parses PDF/DOCX resumes and performs skill extraction and candidate-job matching.

Open a **third** terminal window in the project root:

```powershell
# 1. Navigate to the AI service directory
cd ai_services

# 2. Create and activate a Python virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# (If PowerShell blocks script execution, run: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)

# 3. Install Python dependencies
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# 4. Start the Flask AI microservice
python app.py
```

> 🟢 **AI Service status:** Microservice starts at `http://127.0.0.1:5001`. Verify via `http://127.0.0.1:5001/health`. Keep this terminal open.

---

### Step 5: Demo Data & Initial Accounts

To quickly test the application with realistic data:

1. **Create a Recruiter Account:**
   - Visit `http://localhost:5173/recruiter/register`.
   - Register a recruiter account (e.g., `recruiter@company.com`).
2. **Seed 250 Demo Jobs:**
   - Once at least one recruiter account exists, open a terminal in `backend/` and run:
     ```powershell
     cd backend
     php artisan db:seed --class=DemoJobSeeder
     ```
   - This automatically creates **250 open jobs** spanning Engineering, Product, Design, Marketing, Data/AI, and Operations. Rerunning is safe and will not duplicate jobs.
3. **Create a Job Seeker Account:**
   - Visit `http://localhost:5173/user/register`.
   - Register a candidate account (e.g., `candidate@example.com`).
   - Fill in skills (e.g., `React, Laravel, MySQL, TypeScript`) to unlock tailored recommendations!

---

### 🌐 Service Endpoints & Ports Summary

| Service | Technology | Local URL | Port | Notes |
|:---|:---|:---|:---:|:---|
| **Web Frontend** | React 18 + Vite | `http://localhost:5173` | `5173` | Role-based UI & Dashboards |
| **Backend REST API** | Laravel 12 + Sanctum | `http://127.0.0.1:8000` | `8000` | Auth, Storage, Business Logic |
| **AI Microservice** | Python 3 + Flask | `http://127.0.0.1:5001` | `5001` | PDF/DOCX Parsing & NLP Matching |
| **Database Server** | MySQL / MariaDB | `127.0.0.1:3306` | `3306` | Database: `resume_ats` |

---

## 📸 Application Preview & Screenshots

### 1. Landing Page & Dual Portal Navigation
The public landing page provides clear entry points for hiring teams and candidates with backend-enforced role routing.

![HireFlow Landing Page](screenshots/01-landing-page.svg)

---

### 2. Recruiter Workspace & Dashboard Analytics
Recruiters gain immediate visibility into recruitment metrics, active job postings, candidate pipelines, and AI screening scores.

![Recruiter Dashboard](screenshots/02-recruiter-dashboard.svg)

---

### 3. Job Seeker Discovery Board & Department Analytics
Candidates can filter open positions, view department posting breakdowns, explore salary ranges, and submit applications.

![Job Seeker Board](screenshots/03-jobseeker-dashboard.svg)

---

### 4. AI Resume Screening & Explainable Match Analysis
Inspect candidate match scores with transparent breakdown of matched requirements versus missing skills to develop.

![AI Resume Screening](screenshots/04-ai-matching-analysis.svg)

---

## ☁️ Complete AWS Production Deployment Guide (Beginner Friendly)

This comprehensive guide is designed for beginners. It walks you through deploying HireFlow to Amazon Web Services (AWS) using:
- **Amazon EC2:** Virtual cloud server running Ubuntu Linux to host the React Frontend, Laravel Backend API, and Python Flask AI service.
- **Amazon RDS (MySQL):** Managed relational database service with automatic failover, high availability, and backups.
- **Amazon S3 (Simple Storage Service):** Cloud object storage for:
  1. Storing candidate uploaded resumes securely.
  2. Storing automated daily database backups for disaster recovery.

---

### 1. AWS Cloud Architecture Overview

```text
                                 [ Users / Browser ]
                                          |
                                          | HTTPS (Port 443 / 80)
                                          v
+----------------------------------------------------------------------------------+
|                            AWS VPC (Virtual Cloud)                               |
|                                                                                  |
|  +----------------------------------------------------------------------------+  |
|  |                       Amazon EC2 Instance (Ubuntu 24.04 LTS)               |  |
|  |                                                                            |  |
|  |   +--------------------------------------------------------------------+   |  |
|  |   |                     Nginx Reverse Proxy Server                     |   |  |
|  |   |   - Serves React Frontend (Static Dist Files)                      |   |  |
|  |   |   - Routes /api requests to PHP 8.3-FPM (Laravel 12)               |   |  |
|  |   |   - Proxies AI parser requests to Python Flask (Port 5001)         |   |  |
|  |   +--------------------------------------------------------------------+   |  |
|  |                 |                                    |                     |  |
|  |                 | PHP-FPM                            | Systemd Service     |  |
|  |                 v                                    v                     |  |
|  |     [ Laravel 12 Backend API ]             [ Python Flask AI Service ]     |  |
|  |                 |                                                          |  |
|  |                 | DB Connection (Port 3306)                                |  |
|  +-----------------+----------------------------------------------------------+  |
|                    |                                                             |
|                    v                                                             |
|  +-------------------------------------+      +-------------------------------+  |
|  |     Amazon RDS (MySQL 8.0)          |      |       Amazon S3 Buckets       |  |
|  |  - Managed Database: resume_ats     |      |  1. hireflow-resumes-storage  |  |
|  |  - Internal Security Group Only     |      |  2. hireflow-database-backups |  |
|  +-------------------------------------+      +-------------------------------+  |
|                    |                                          ^                  |
|                    +--- Automated Daily mysqldump Backup -----+                  |
+----------------------------------------------------------------------------------+
```

---

### Phase 1: IAM User & Security Credentials

An IAM User with programmatic access keys gives your EC2 server permission to upload resumes and database backups to Amazon S3.

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, type **IAM** and click on the **IAM** service.
3. In the left navigation menu, click **Users** &rarr; click **Create user**.
4. Set the user details:
   - **User name:** `hireflow-app-user`
   - Leave "Provide user access to the AWS Management Console" **unchecked** (programmatic access only).
   - Click **Next**.
5. Set permissions:
   - Select **Attach policies directly**.
   - In the search bar, search for `AmazonS3FullAccess`.
   - Check the box next to **`AmazonS3FullAccess`**.
   - Click **Next** &rarr; click **Create user**.
6. Create Access Keys:
   - Click on the newly created user `hireflow-app-user`.
   - Go to the **Security credentials** tab.
   - Scroll down to the **Access keys** section and click **Create access key**.
   - Select **Application running on an AWS compute service** &rarr; check the confirmation box &rarr; click **Next**.
   - (Optional) Add a description like `HireFlow EC2 S3 access`.
   - Click **Create access key**.
7. ⚠️ **IMPORTANT:** Copy your **Access Key ID** and **Secret Access Key** immediately and save them securely (or click **Download .csv file**). You will not be able to view the secret key again.

---

### Phase 2: Create Amazon S3 Buckets

You will create two separate S3 buckets:
1. `hireflow-resumes-storage-<your-unique-suffix>`: for candidate resumes.
2. `hireflow-database-backups-<your-unique-suffix>`: for MySQL database backup dumps.

> *Note: S3 bucket names are globally unique across all AWS accounts worldwide. Replace `<your-unique-suffix>` with your name or random numbers (e.g., `hireflow-resumes-storage-john99`).*

#### Create Bucket 1 (Resumes):
1. In the AWS search bar, type **S3** and select **S3**.
2. Click **Create bucket**.
3. **Bucket name:** `hireflow-resumes-storage-<your-unique-suffix>`
4. **AWS Region:** Choose the region closest to you (e.g., `us-east-1` (N. Virginia) or `ap-south-1` (Mumbai)). *Keep all your AWS resources in the same region!*
5. Under **Block Public Access settings for this bucket**:
   - Keep **Block all public access** checked. Resumes contain sensitive candidate data and will be securely downloaded through authorized backend API routes.
6. Under **Default encryption**:
   - Select **Server-side encryption with Amazon S3 managed keys (SSE-S3)**.
7. Click **Create bucket**.

#### Create Bucket 2 (Database Backups):
1. Click **Create bucket** again.
2. **Bucket name:** `hireflow-database-backups-<your-unique-suffix>`
3. **AWS Region:** Same region as above.
4. Keep **Block all public access** checked.
5. Click **Create bucket**.

---

### Phase 3: Create and Configure Amazon RDS (MySQL)

Amazon RDS manages your MySQL server in the cloud with zero maintenance.

#### 1. Create RDS Database Instance
1. In the AWS search bar, type **RDS** and select **RDS**.
2. In the RDS dashboard, click **Create database**.
3. Select configuration options:
   - **Choose a database creation method:** Standard create
   - **Engine type:** MySQL
   - **Engine Version:** MySQL 8.0 (select latest 8.0.x)
   - **Templates:** Choose **Free tier** (gives 750 free hours/month).
4. **Settings:**
   - **DB instance identifier:** `hireflow-db`
   - **Master username:** `admin`
   - **Master password:** Set a strong password (e.g., `HireFlowSecurePass2026!`). Record this password!
5. **Instance configuration:**
   - **DB instance class:** Burstable classes &rarr; `db.t3.micro` or `db.t4g.micro` (Free tier eligible).
6. **Storage:**
   - **Storage type:** General Purpose SSD (gp2 or gp3)
   - **Allocated storage:** `20` GiB
   - **Enable storage autoscaling:** Uncheck (to prevent unexpected costs).
7. **Connectivity:**
   - **Virtual private cloud (VPC):** Default VPC
   - **Public access:** Select **Yes** (temporary for initial testing, or **No** if you only access it from inside the VPC EC2 instance).
   - **VPC security group:** Select **Create new**:
     - **New VPC security group name:** `hireflow-rds-sg`
8. **Additional configuration:**
   - Click to expand **Additional configuration**.
   - **Initial database name:** `resume_ats` (⚠️ Do not skip this; this creates the database).
   - **Backup retention period:** `7 days` (enables automated daily snapshots).
9. Click **Create database** at the bottom.
10. Database creation takes **5-10 minutes**. When the status changes to **Available**, click on `hireflow-db`.
11. Under **Connectivity & security**, copy the **Endpoint** URL (e.g. `hireflow-db.c3xxxxxx.us-east-1.rds.amazonaws.com`). This is your `DB_HOST`.

#### 2. Allow EC2 to Connect to RDS Security Group
1. On the RDS details page, under **Connectivity & security**, click on the link under **VPC security groups** (`hireflow-rds-sg`).
2. Select the security group &rarr; click the **Inbound rules** tab &rarr; click **Edit inbound rules**.
3. Click **Add rule**:
   - **Type:** `MySQL/Aurora` (Port `3306`)
   - **Source:** Select **Anywhere-IPv4** (`0.0.0.0/0`) during initial setup, or better, select your EC2 Security Group ID once EC2 is created.
4. Click **Save rules**.

---

### Phase 4: Launch and Configure Amazon EC2 Instance

Now launch an Ubuntu virtual machine on EC2 to host the web application.

#### 1. Launch EC2 Instance
1. In the AWS search bar, type **EC2** and select **EC2**.
2. Click **Launch instance**.
3. **Name:** `hireflow-production-server`
4. **Application and OS Images:**
   - Select **Ubuntu** &rarr; **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type** (Free tier eligible).
5. **Instance type:**
   - Select `t2.micro` or `t3.micro` (1 vCPU, 1 GiB Memory, Free tier eligible).
6. **Key pair (login):**
   - Click **Create new key pair**.
   - **Key pair name:** `hireflow-key`
   - **Key pair type:** `RSA`
   - **Private key file format:** `.pem` (for OpenSSH / PowerShell / Mac / Linux).
   - Click **Create key pair**. Save `hireflow-key.pem` to your computer (e.g., in `C:\Users\<username>\.ssh\` or your Downloads folder).
7. **Network settings:**
   - Check **Allow SSH traffic from** &rarr; `Anywhere (0.0.0.0/0)` (or `My IP` for enhanced security).
   - Check **Allow HTTP traffic from the internet** (Port 80).
   - Check **Allow HTTPS traffic from the internet** (Port 443).
8. **Configure storage:**
   - `15 GiB` gp3 root volume (Free tier provides up to 30 GB EBS).
9. Click **Launch instance**.
10. Click on the new Instance ID. Note down your **Public IPv4 address** (e.g., `54.210.120.45`).

#### 2. Connect to EC2 via SSH
Open PowerShell on your local Windows machine (or Terminal on macOS/Linux):

```powershell
# 1. Navigate to the directory containing your downloaded .pem key file:
cd C:\Users\<YourUsername>\Downloads

# 2. On Windows, secure key file permissions (read-only for your user):
icacls hireflow-key.pem /inheritance:r
icacls hireflow-key.pem /grant:r "$($env:USERNAME):(R)"

# (On Mac/Linux, you would run: chmod 400 hireflow-key.pem)

# 3. Connect to your EC2 instance (replace with your EC2 Public IP):
ssh -i hireflow-key.pem ubuntu@54.210.120.45
```

Type `yes` when prompted to verify host authenticity. You are now logged in as the `ubuntu` user on your AWS cloud server!

---

### Phase 5: Install Server Environment on EC2

Run these commands in your SSH terminal on EC2 to install all necessary production software:

#### 1. Update Packages & Add PHP PPA
```bash
sudo apt update && sudo apt upgrade -y

# Install essential build tools & utilities
sudo apt install -y software-properties-common curl git unzip zip nginx awscli mysql-client

# Add PHP PPA for PHP 8.3
sudo add-apt-repository -y ppa:ondrej/php
sudo apt update
```

#### 2. Install PHP 8.3 & Required Extensions
```bash
sudo apt install -y php8.3-fpm php8.3-cli php8.3-mysql php8.3-curl \
    php8.3-gd php8.3-mbstring php8.3-xml php8.3-zip php8.3-bcmath php8.3-intl
```

#### 3. Install Composer (PHP Package Manager)
```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

#### 4. Install Node.js (v20 LTS) & npm
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

#### 5. Install Python 3 & Virtual Environment
```bash
sudo apt install -y python3 python3-pip python3-venv
python3 --version
```

---

### Phase 6: Deploy HireFlow Code to EC2

#### 1. Clone the Project to `/var/www/hireflow`
```bash
sudo mkdir -p /var/www/hireflow
sudo chown -R ubuntu:ubuntu /var/www/hireflow

# Clone your GitHub repository (replace with your repo URL):
git clone https://github.com/<your-username>/<your-repo-name>.git /var/www/hireflow
cd /var/www/hireflow
```

---

#### 2. Configure Laravel Backend & Connect to AWS RDS

```bash
cd /var/www/hireflow/backend

# Create production .env file
cp .env.example .env

# Open .env in nano editor
nano .env
```

Update the following keys in `backend/.env` with your AWS credentials:

```dotenv
APP_NAME="HireFlow ATS"
APP_ENV=production
APP_DEBUG=false
APP_URL=http://YOUR_EC2_PUBLIC_IP

# AWS RDS MySQL Connection Details
DB_CONNECTION=mysql
DB_HOST=hireflow-db.c3xxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_DATABASE=resume_ats
DB_USERNAME=admin
DB_PASSWORD=YourHireFlowPassword2026!

# Session & Frontend
SESSION_DRIVER=database
SANCTUM_STATEFUL_DOMAINS=YOUR_EC2_PUBLIC_IP
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP
CORS_ALLOWED_ORIGINS=http://YOUR_EC2_PUBLIC_IP

# AI Microservice URL running on EC2 localhost
AI_SERVICE_URL=http://127.0.0.1:5001

# File storage driver (configured in Phase 7)
FILESYSTEM_DISK=s3
```

Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit `nano`.

Now install backend dependencies and run database migrations on RDS:

```bash
# Install PHP dependencies without dev packages
composer install --no-dev --optimize-autoloader

# Generate application key
php artisan key:generate --force

# Run database migrations directly against your AWS RDS instance!
php artisan migrate --seed --force

# Seed demo jobs (optional)
# php artisan db:seed --class=DemoJobSeeder --force

# Optimize Laravel cache for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Grant web server write permissions to storage & bootstrap/cache
sudo chown -R ubuntu:www-data /var/www/hireflow/backend/storage
sudo chown -R ubuntu:www-data /var/www/hireflow/backend/bootstrap/cache
sudo chmod -R 775 /var/www/hireflow/backend/storage
sudo chmod -R 775 /var/www/hireflow/backend/bootstrap/cache
```

---

#### 3. Setup Python Flask AI Microservice as a Systemd Service

Create a virtual environment and install Python dependencies:

```bash
cd /var/www/hireflow/ai_services
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt gunicorn
deactivate
```

Create a `systemd` service so the Flask AI service automatically starts and restarts on server reboot:

```bash
sudo nano /etc/systemd/system/hireflow-ai.service
```

Paste the following service configuration:

```ini
[Unit]
Description=HireFlow Python AI Resume Parsing Microservice
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/hireflow/ai_services
Environment="PATH=/var/www/hireflow/ai_services/venv/bin"
Environment="PORT=5001"
Environment="HOST=127.0.0.1"
ExecStart=/var/www/hireflow/ai_services/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5001 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable hireflow-ai
sudo systemctl start hireflow-ai
sudo systemctl status hireflow-ai
```

---

#### 4. Build the React Frontend

```bash
cd /var/www/hireflow/frontend

# Create production frontend environment
nano .env
```

Add your EC2 public IP or domain:
```dotenv
VITE_BACKEND_URL=http://YOUR_EC2_PUBLIC_IP
VITE_API_URL=/api
```

Build the static production assets:
```bash
npm install
npm run build
```

This compiles optimized HTML, CSS, and JS files into `/var/www/hireflow/frontend/dist`.

---

#### 5. Configure Nginx Web Server

Create a unified Nginx configuration that:
- Serves the React frontend on `/`.
- Passes `/api` requests to PHP-FPM for Laravel.
- Proxies `/ai/` requests to the Flask service on port `5001`.

```bash
sudo nano /etc/nginx/sites-available/hireflow
```

Paste the following Nginx configuration (replace `YOUR_EC2_PUBLIC_IP` with your actual EC2 public IP):

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    client_max_body_size 20M;

    # 1. React Frontend (Serve compiled dist files)
    root /var/www/hireflow/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Laravel Backend API
    location ^~ /api {
        alias /var/www/hireflow/backend/public;
        try_files $uri $uri/ @laravel;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME /var/www/hireflow/backend/public/index.php;
            fastcgi_pass unix:/run/php/php8.3-fpm.sock;
            fastcgi_index index.php;
        }
    }

    location @laravel {
        rewrite /api/(.*)$ /api/index.php?/$1 last;
    }

    # 3. Direct PHP processing for Laravel public root
    location ~ ^/backend/(.+\.php)$ {
        alias /var/www/hireflow/backend/public/$1;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        include fastcgi_params;
    }

    # 4. Logs
    access_log /var/log/nginx/hireflow_access.log;
    error_log /var/log/nginx/hireflow_error.log;
}
```

Enable the site and reload Nginx:

```bash
sudo ln -sf /etc/nginx/sites-available/hireflow /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Visit `http://YOUR_EC2_PUBLIC_IP` in your browser. HireFlow is now live on the internet!

---

### Phase 7: Store Uploaded Files in Amazon S3

Now configure Laravel to stream uploaded candidate resumes directly to your Amazon S3 bucket.

#### 1. Install AWS S3 Flysystem Package in Laravel
On your EC2 terminal:
```bash
cd /var/www/hireflow/backend
composer require league/flysystem-aws-s3-v3 "^3.0" --update-no-dev
```

#### 2. Update Laravel `.env` with AWS S3 Credentials
Open `backend/.env`:
```bash
nano .env
```

Add your S3 configuration and IAM user keys:
```dotenv
# Change default filesystem disk to s3
FILESYSTEM_DISK=s3

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=your_secret_access_key_from_phase_1
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=hireflow-resumes-storage-your-unique-suffix
AWS_USE_PATH_STYLE_ENDPOINT=false
```

Clear and update configuration cache:
```bash
php artisan config:clear
php artisan config:cache
```

#### 3. Verify S3 Resume Ingestion
1. Log in as a job seeker on `http://YOUR_EC2_PUBLIC_IP/user/auth`.
2. Go to **Resume & Skills** &rarr; upload a PDF resume.
3. In your browser, open the [AWS S3 Console](https://s3.console.aws.amazon.com/).
4. Click on `hireflow-resumes-storage-...` &rarr; click on the `resumes/` folder.
5. You will see your newly uploaded resume file stored securely in the cloud!

---

### Phase 8: Automated RDS Database Backups to Amazon S3

Protect your database from data loss by automating daily snapshots and dumping compressed `.sql.gz` backups directly into Amazon S3.

#### 1. Configure AWS CLI on EC2
On your EC2 SSH session, configure the AWS credentials:
```bash
aws configure
```
Provide:
- **AWS Access Key ID:** `AKIAXXXXXXXXXXXXXXXX` (from Phase 1)
- **AWS Secret Access Key:** `your_secret_access_key`
- **Default region name:** `us-east-1` (your chosen region)
- **Default output format:** `json`

Verify S3 access:
```bash
aws s3 ls
```
*(This will list your S3 buckets).*

---

#### 2. Create the Database Backup Script
Create a backup directory and script:
```bash
mkdir -p /home/ubuntu/scripts
nano /home/ubuntu/scripts/backup_db_to_s3.sh
```

Paste the following automated backup script:

```bash
#!/bin/bash
# ==============================================================================
# HireFlow Automated RDS MySQL Backup to AWS S3
# ==============================================================================

# Configurations (Update these values)
RDS_HOST="hireflow-db.c3xxxxxx.us-east-1.rds.amazonaws.com"
DB_USER="admin"
DB_PASS="YourHireFlowPassword2026!"
DB_NAME="resume_ats"
S3_BUCKET="s3://hireflow-database-backups-your-unique-suffix"

# Timestamp & File Naming
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/tmp/hireflow_backups"
FILENAME="resume_ats_backup_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

# Create temporary directory
mkdir -p ${BACKUP_DIR}

echo "[$(date)] Starting MySQL backup for ${DB_NAME}..."

# Export database using mysqldump and compress with gzip
mysqldump -h ${RDS_HOST} -u ${DB_USER} -p"${DB_PASS}" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    ${DB_NAME} | gzip > ${FILEPATH}

# Check if dump succeeded
if [ $? -eq 0 ]; then
    echo "[$(date)] Backup completed successfully. Uploading to Amazon S3..."
    
    # Upload to Amazon S3
    aws s3 cp ${FILEPATH} ${S3_BUCKET}/${FILENAME}
    
    if [ $? -eq 0 ]; then
        echo "[$(date)] Successfully uploaded ${FILENAME} to ${S3_BUCKET}!"
    else
        echo "[$(date)] ERROR: Failed to upload backup to S3." >&2
    fi
else
    echo "[$(date)] ERROR: mysqldump failed." >&2
fi

# Clean up local temporary file
rm -f ${FILEPATH}
echo "[$(date)] Backup cleanup completed."
```

Make the script executable:
```bash
chmod +x /home/ubuntu/scripts/backup_db_to_s3.sh
```

---

#### 3. Test the Backup Script Manually
Run the script to verify that it exports the database and uploads it to S3:
```bash
/home/ubuntu/scripts/backup_db_to_s3.sh
```

Check your S3 bucket in the AWS Console or via CLI:
```bash
aws s3 ls s3://hireflow-database-backups-your-unique-suffix/
```
You should see:
`2026-10-28 14:45:00  15320 resume_ats_backup_2026-10-28_14-45-00.sql.gz`

---

#### 4. Schedule Automated Daily Backups with Cron
Open the crontab editor:
```bash
crontab -e
```
*(If prompted, choose `1` for nano).*

Add this line at the bottom to automatically take a database backup **every night at 2:00 AM UTC**:
```cron
0 2 * * * /home/ubuntu/scripts/backup_db_to_s3.sh >> /home/ubuntu/scripts/backup.log 2>&1
```
Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).

---

#### 5. How to Restore Database from S3 (Disaster Recovery)
If you ever need to restore your database from an S3 backup:
```bash
# 1. Download the latest backup from S3:
aws s3 cp s3://hireflow-database-backups-your-unique-suffix/resume_ats_backup_YYYY-MM-DD_HH-MM-SS.sql.gz /tmp/backup.sql.gz

# 2. Decompress the file:
gunzip /tmp/backup.sql.gz

# 3. Import back into AWS RDS MySQL:
mysql -h hireflow-db.c3xxxxxx.us-east-1.rds.amazonaws.com -u admin -p resume_ats < /tmp/backup.sql
```

---

### Phase 9: Free SSL Certificate (HTTPS) with Certbot

To secure your production app with `https://`:

1. Point your domain (e.g. `hireflow.yourdomain.com`) to your EC2 Public IP using an **A Record** in your DNS provider (e.g., Route 53, GoDaddy, Cloudflare, Namecheap).
2. On your EC2 server, install Certbot:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```
3. Run Certbot to automatically configure SSL:
   ```bash
   sudo certbot --nginx -d hireflow.yourdomain.com
   ```
4. Enter your email and accept terms. Certbot will automatically issue and install a Let's Encrypt SSL certificate and configure HTTPS redirection!
5. Test automatic certificate renewal:
   ```bash
   sudo certbot renew --dry-run
   ```

---

## 🏗️ System Architecture

```text
               +--------------------------------------------------+
               |            React 18 + Vite (Port 5173)           |
               |  - Recruiter Workspace   - Job Seeker Dashboard  |
               |  - Interactive Charts    - Application Tracker   |
               +-------------------------+------------------------+
                                         | Bearer Token (Sanctum)
                                         v
               +--------------------------------------------------+
               |           Laravel 12 API (Port 8000)             |
               |  - Sanctum Auth          - Role-based Gates      |
               |  - Job Management        - Application Workflow  |
               |  - AWS S3 Storage        - Fallback Skill Engine |
               +-------------------+---------------+--------------+
                                   |               |
             AWS S3 Storage Disk   |               | HTTP Ingestion
       (s3://hireflow-resumes)     |               v
                                   |    +-------------------------+
                                   |    |  Flask AI (Port 5001)   |
                                   |    |  - PyPDF / python-docx  |
                                   |    |  - Skill Extraction     |
                                   |    |  - Vector Overlap Match |
                                   |    +-------------------------+
                                   v
               +--------------------------------------------------+
               |          Amazon RDS MySQL 8.0 (Port 3306)        |
               |  - users, candidates, jobs, applications,        |
               |    matches, skills, personal_access_tokens       |
               +--------------------------------------------------+
```

---

## 🚀 Key Features

### 👤 For Job Seekers
- **Interactive Job Discovery:** Search through open vacancies with keyword search, department categorization, and employment type filters.
- **Department Distribution Analytics:** Visual bar graphs showing vacancy trends across Engineering, Design, Product, Marketing, Data, and Operations.
- **AI-Powered Recommendations:** Profile-driven job matching showing precise match percentage, reason explanations, and missing skill suggestions.
- **Resume Parsing & Profile Ingestion:** Upload PDF, DOC, or DOCX resumes (up to 10 MB) with automatic skill, education, and experience extraction.
- **Application Tracking Pipeline:** Monitor application status in real-time across stages:
  - `applied` &rarr; `shortlisted` &rarr; `interview` &rarr; `offer extended` &rarr; `hired` / `declined`.
- **Offer Management:** Accept or decline job offers directly from the dashboard.

### 🏢 For Recruiters & Talent Teams
- **Real-Time Analytics Dashboard:** Key recruitment indicators including Total Applicants, Active Listings, Shortlisted Candidates, and Scheduled Interviews.
- **Job Posting Management:** Create, update, pause, and close listings with rich department classification and employment types.
- **Automated Resume Parsing:** Batch or single resume ingestion with parsed candidate contact information, experience history, and verified skills.
- **Explainable AI Candidate Screening:** Rank applicants by objective skill-overlap percentages.
- **Candidate Pipeline & Notes:** Add internal notes, download original candidate resumes securely, and trigger stage progressions.
- **Interview Scheduling:** Built-in interview management with date, time, and meeting details communicated directly to applicant dashboards.

---

## 🤖 Explainable AI Matching Algorithm

HireFlow eliminates hiring bias by avoiding opaque black-box machine learning models for initial candidate screening:
1. **Verified Skill Overlap:** Matches candidate verified skills against explicit job requirements.
   $$\text{Match Percentage} = \left( \frac{|\text{Candidate Verified Skills} \cap \text{Job Required Skills}|}{|\text{Job Required Skills}|} \right) \times 100$$
2. **Transparent Explanations:** Candidates and recruiters receive a clear breakdown of:
   - **Matched Skills:** Identified directly from candidate work history and certifications.
   - **Skills to Develop:** Missing required skills for candidate career growth.
3. **No Biased Scoring:** Age, gender, ethnicity, location, and non-skill attributes are strictly excluded from match calculations.

---

## 🔌 API Endpoints Reference

### Public Routes
- `POST /api/recruiter/register` — Register a recruiter account (`role: hr`)
- `POST /api/user/register` — Register a job seeker account (`role: job_seeker`)
- `POST /api/recruiter/login` — Recruiter authentication
- `POST /api/user/login` — Job seeker authentication
- `GET /api/public/jobs` — Retrieve open job postings with filters
- `GET /api/public/jobs/{job}` — Retrieve public job details

### Authenticated User Routes (`auth:sanctum`)
- `GET /api/me` — Retrieve current authenticated user profile and role
- `POST /api/logout` — Revoke active Sanctum token
- `GET /api/profile` — Fetch candidate profile and parsed resume details
- `PUT /api/profile` — Update candidate bio, preferences, and skills

### Job Seeker Routes (`role: job_seeker, candidate`)
- `POST /api/user/resumes` — Upload candidate resume file (PDF/DOC/DOCX)
- `GET /api/user/resumes/{candidate}/download` — Securely download uploaded resume
- `GET /api/user/recommendations` — Fetch personalized job recommendations
- `GET /api/user/applications` — List submitted applications with timeline status
- `POST /api/user/jobs/{job}/apply` — Submit application (with profile or custom CV)
- `POST /api/user/applications/{application}/accept-offer` — Accept extended job offer
- `POST /api/user/applications/{application}/reject-offer` — Decline job offer

### Recruiter Routes (`role: hr`)
- `GET /api/dashboard/stats` — Metrics overview (applicants, open jobs, interviews)
- `GET, POST /api/jobs` — List all recruiter jobs or create a new opening
- `PUT, DELETE /api/jobs/{job}` — Update or remove job listing
- `GET /api/candidates` — List ingested candidates with AI match rankings
- `GET /api/candidates/{candidate}` — Full candidate profile and parsed history
- `PATCH /api/candidates/{candidate}/notes` — Update recruiter evaluation notes
- `GET /api/candidates/{candidate}/resume` — Download candidate original resume file
- `GET /api/applications` — List applications across all recruiter jobs
- `PATCH /api/applications/{application}` — Transition applicant status (shortlist, interview, offer)
- `POST /api/upload-resume` — Ingest candidate resume file
- `GET /api/matches` — Full matches matrix

---

## 📂 Project Directory Structure

```text
Applicant tracking/
├── backend/                  # Laravel 12 API Application
│   ├── app/                  # Controllers, Models, Middleware, Services
│   ├── config/               # Application configuration (filesystems, database)
│   ├── database/             # Migrations and Seeders (DemoJobSeeder, SkillSeeder)
│   ├── routes/api.php        # REST API Route Definitions
│   └── storage/              # Local private resume storage & logs
├── frontend/                 # React 18 + Vite Application
│   ├── src/                  # React Components, Dashboards, and Styling
│   │   ├── App.jsx           # Main Router & Recruiter Workspace
│   │   ├── JobSeekerDashboard.jsx # Candidate Dashboard & Charts
│   │   ├── jobOptions.js     # Shared Department & Employment Enums
│   │   └── styles.css        # Responsive Design System
│   └── vite.config.js        # Vite config with API proxy
├── ai_services/              # Python Flask Microservice
│   ├── app.py                # Resume text extraction & skill matching
│   └── requirements.txt      # PyPDF, python-docx, Flask, Flask-CORS, Gunicorn
└── screenshots/              # Application preview illustrations & mockups
```

---

## 🛠️ Troubleshooting & FAQs

### 1. PowerShell blocks virtual environment activation
**Error:** `Activate.ps1 cannot be loaded because running scripts is disabled on this system.`  
**Solution:** Open PowerShell as Administrator (or in current terminal session) and run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### 2. EC2 cannot connect to AWS RDS (`Connection timed out` or `Access denied`)
- Ensure the **Security Group of your RDS instance** has an inbound rule allowing port `3306` from your EC2 Security Group ID (or `0.0.0.0/0`).
- Verify that `DB_HOST` in `backend/.env` is the exact RDS Endpoint URL without `http://` or port.
- Test connection directly from EC2 terminal:
  ```bash
  mysql -h your-rds-endpoint.rds.amazonaws.com -u admin -p
  ```

### 3. S3 file upload gives `Access Denied (403 Forbidden)`
- Verify that your IAM user has `AmazonS3FullAccess` attached.
- Double-check `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `backend/.env`.
- Ensure `AWS_DEFAULT_REGION` matches the region where your S3 bucket was created.
- Run `php artisan config:clear` on EC2 to refresh cached settings.

### 4. Vite cannot connect to backend (`Failed to fetch / 500`)
- Confirm Laravel is running on port 8000 locally: `php artisan serve --port 8000`.
- Verify database connectivity in `backend/.env`. If you altered `.env`, run:
  ```powershell
  cd backend
  php artisan config:clear
  ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
