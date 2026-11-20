# CampusDesk - Student Portal with Deployment Time Reduction

A small Node.js and Express student portal used to demonstrate Git, GitHub, CI/CD, Docker and cloud deployment.

## Demo accounts

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Student | `student` | `student123` |

Only these two predefined accounts are accepted. The server checks the role on protected pages and API routes.

## Features

- Student dashboard with sample marks and attendance.
- Student can submit a marks-review request.
- Admin can view requests, accept or reject them, and send a message.
- Student can see the request status and admin response.
- Health endpoint: `GET /health`.

## Run locally

Requirements: Node.js 18 or later and npm.

```bash
npm install
npm start
```

Open `http://localhost:3000`.

Run automated tests:

```bash
npm test -- --runInBand
```

## Run with Docker

```bash
docker build -t campusdesk:1.0 .
docker run --rm -p 10000:10000 -e SESSION_SECRET=local-demo-secret campusdesk:1.0
```

Open `http://localhost:10000`.

## CI/CD workflow

The GitHub Actions workflow is `.github/workflows/ci-cd.yml`.

1. A push to `main` or pull request targeting `main` starts the workflow.
2. GitHub Actions checks out the repository and installs Node.js dependencies.
3. Jest automated tests run.
4. If tests pass and the event is a push to `main`, the deploy job calls the Render Deploy Hook.
5. Render builds the Dockerfile and deploys the new image. Render checks `/health` before marking the service healthy.

The Dockerfile is also available for local builds. Render performs the production image build so the same image is not unnecessarily built twice in the automated path.

Pull requests run tests and build the image but do not deploy to production.

## Deploy to Render

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint** and connect this repository. Render reads `render.yaml` and builds the Dockerfile.
3. The blueprint sets `autoDeploy: false` so GitHub Actions controls when Render is asked to deploy.
4. After the Render web service is created, open its settings and copy its Deploy Hook URL.
5. In GitHub, open **Settings > Secrets and variables > Actions > New repository secret**.
6. Set the secret name to `RENDER_DEPLOY_HOOK` and paste the Deploy Hook URL as its value.
7. Push a new commit to `main`. GitHub Actions will test, build and then trigger Render.

Do not put the Deploy Hook URL or session secret directly in source code.

## Measuring deployment time

Record real timings during the demonstration. Compare the same change and the same validation steps in both methods:

- Manual baseline: manually install/build, run tests and initiate deployment.
- Automated flow: push a commit and record the GitHub Actions and Render deployment timestamps.

Formula:

`Time saved (%) = ((Manual time - Automated time) / Manual time) * 100`

Report both the pipeline duration and the time until Render reports the service healthy. Do not present sample timings as measured results.

## Demo limitations and security note

- Student marks and attendance are fictional sample data.
- Requests are held in application memory. They reset when the Node process restarts and are not shared between multiple service instances. This is acceptable for a short classroom demo, not for a real student information system.
- The requested demo passwords are hardcoded for this academic demonstration only. Never use these credentials for a real service.
- Express's default in-memory session store is also intended only for a small demonstration, not production-scale use.
