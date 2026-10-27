"""Resume parsing and transparent job-skill comparison service."""

from __future__ import annotations

import json
import os
import re

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

KNOWN_SKILLS = [
    "react", "javascript", "typescript", "node", "nodejs", "vue", "angular",
    "laravel", "php", "python", "django", "flask", "fastapi", "java", "spring",
    "machine learning", "deep learning", "nlp", "natural language processing",
    "tensorflow", "pytorch", "scikit-learn", "sql", "mysql", "postgresql",
    "mongodb", "redis", "docker", "kubernetes", "aws", "azure", "gcp",
    "tailwind", "css", "html", "git", "ci/cd", "agile", "scrum",
    "rest api", "graphql", "microservices", "figma", "ui/ux",
    "data analysis", "pandas", "numpy", "spark", "hadoop",
    "c++", "c#", ".net", "ruby", "rails", "go", "golang", "rust", "swift",
    "kotlin", "android", "ios", "selenium", "jest", "cypress",
]

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}")


def parse_resume_text(file_bytes: bytes, filename: str, fallback_text: str = "") -> str:
    ext = (filename or "").lower().split(".")[-1]

    if fallback_text and fallback_text.strip():
        return fallback_text.strip()

    if ext == "pdf":
        try:
            from pypdf import PdfReader
            import io

            reader = PdfReader(io.BytesIO(file_bytes))
            pages = [p.extract_text() or "" for p in reader.pages]
            return "\n".join(pages).strip()
        except Exception:
            return ""

    if ext in ("doc", "docx"):
        try:
            import io
            from docx import Document

            doc = Document(io.BytesIO(file_bytes))
            return "\n".join(p.text for p in doc.paragraphs).strip()
        except Exception:
            return ""

    try:
        return file_bytes.decode("utf-8", errors="ignore").strip()
    except Exception:
        return ""


def extract_contact(text: str) -> dict:
    email = None
    phone = None
    name = None

    emails = EMAIL_RE.findall(text or "")
    if emails:
        email = emails[0]

    phones = PHONE_RE.findall(text or "")
    if phones:
        phone = phones[0] if isinstance(phones[0], str) else "".join(phones[0])

    lines = [ln.strip() for ln in (text or "").splitlines() if ln.strip()]
    for line in lines[:8]:
        if EMAIL_RE.search(line) or PHONE_RE.search(line):
            continue
        if 2 <= len(line.split()) <= 5 and len(line) < 60:
            name = line
            break

    return {"name": name, "email": email, "phone": phone}


def extract_skills(text: str) -> list[str]:
    found = []
    for skill in KNOWN_SKILLS:
        if contains_skill(text or "", skill):
            found.append(skill.title() if skill != "ci/cd" else "CI/CD")
    return list(dict.fromkeys(found))


def contains_skill(text: str, skill: str) -> bool:
    return re.search(r"(?<![a-z0-9])" + re.escape(skill) + r"(?![a-z0-9])", text, re.IGNORECASE) is not None


def extract_education(text: str) -> list[dict]:
    entries = []
    keywords = ["bachelor", "master", "phd", "b.sc", "m.sc", "mba", "university", "college", "degree"]
    for line in (text or "").splitlines():
        ln = line.strip()
        if not ln:
            continue
        low = ln.lower()
        if any(k in low for k in keywords) and len(ln) < 200:
            entries.append({"summary": ln})
    return entries[:5]


def extract_experience(text: str) -> list[dict]:
    entries = []
    keywords = ["experience", "worked", "developer", "engineer", "manager", "intern", "years"]
    for line in (text or "").splitlines():
        ln = line.strip()
        if not ln:
            continue
        low = ln.lower()
        if any(k in low for k in keywords) and len(ln) < 250:
            entries.append({"summary": ln})
    return entries[:8]


def skill_overlap_score(
    required: list[str],
    extracted: list[str],
    resume_text: str,
    job_description: str,
) -> tuple[int, dict]:
    req = [s.lower() for s in required] if required else []
    if not req:
        req = [skill.lower() for skill in extract_skills(job_description)]

    matched = []
    missing = []
    for skill in req:
        if contains_skill(resume_text, skill):
            matched.append(skill.title())
        else:
            missing.append(skill.title())

    pct = int(round((len(matched) / len(req)) * 100)) if req else 0

    comparison = {
        "matched": matched,
        "missing": missing,
        "extracted": extracted,
        "required": [skill.title() for skill in req],
    }
    return pct, comparison


def generate_interview_questions(skills: list[str], job_title: str) -> list[str]:
    base = [
        f"Describe your experience relevant to the {job_title or 'role'}.",
        "Tell us about a challenging project and how you delivered it.",
        "How do you prioritize tasks when handling multiple deadlines?",
    ]
    for skill in (skills or [])[:4]:
        base.append(f"Rate your proficiency in {skill} and give a concrete example.")
    return base[:8]


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "resume-ai",
        "matching_method": "explicit_skill_overlap",
    })


@app.route("/parse-and-match", methods=["POST"])
def parse_and_match():
    job_description = request.form.get("job_description", "")
    job_title = request.form.get("job_title", "")
    candidate_id = request.form.get("candidate_id", "")
    resume_text_override = request.form.get("resume_text", "")

    required_raw = request.form.get("required_skills", "[]")
    try:
        required_skills = json.loads(required_raw) if required_raw else []
    except json.JSONDecodeError:
        required_skills = []

    f = request.files.get("resume")
    if not f:
        return jsonify({"error": "resume file missing"}), 400

    filename = secure_filename(f.filename or "resume.pdf")
    path = os.path.join(UPLOAD_DIR, filename)
    f.save(path)

    with open(path, "rb") as fb:
        file_bytes = fb.read()

    resume_text = parse_resume_text(file_bytes, filename, resume_text_override)
    contact = extract_contact(resume_text)
    skills = extract_skills(resume_text)
    education = extract_education(resume_text)
    experience = extract_experience(resume_text)

    skill_pct, skill_comparison = skill_overlap_score(
        required_skills,
        skills,
        resume_text,
        job_description,
    )
    match_percentage = skill_pct
    interview_questions = generate_interview_questions(
        skills or required_skills,
        job_title,
    )

    return jsonify({
        "candidate_id": candidate_id,
        "name": contact["name"],
        "email": contact["email"],
        "phone": contact["phone"],
        "skills": skills,
        "education": education,
        "experience": experience,
        "match_percentage": match_percentage,
        "skill_score": skill_pct,
        "match_explanation": (
            f"{len(skill_comparison['matched'])} of "
            f"{len(skill_comparison['required'])} identified job skills appear in the resume."
            if skill_comparison["required"]
            else "A skill score is unavailable because this job has no explicit or recognized skill requirements."
        ),
        "rank": 1,
        "skill_comparison": skill_comparison,
        "interview_questions": interview_questions,
        "matches": [
            {
                "job_title": job_title,
                "rank": 1,
                "match_percentage": match_percentage,
                "status": "needs_review",
                "skills": skills,
                "skill_comparison": skill_comparison,
            }
        ],
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"Resume AI service listening on http://127.0.0.1:{port}")
    app.run(
        host=os.environ.get("HOST", "0.0.0.0"),
        port=port,
        debug=os.environ.get("FLASK_DEBUG", "0") == "1",
    )
