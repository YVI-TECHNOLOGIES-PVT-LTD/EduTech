# EduTrack Postman & Newman API Testing Guide

## Overview
This directory contains Postman collections, environment templates, and execution guides for testing EduTrack Enterprise API endpoints.

## Directory Structure
- `postman/collections/`: API Collections (`auth`, `admission`, `common`)
- `postman/environments/`: Environment templates (`development`, `staging`, `production`)
- `postman/globals/`: Global variable templates
- `newman/reports/`: HTML, JSON, and JUnit test report output

## Running API Tests locally
```bash
# Run all Postman API test collections via Newman
pnpm run test:all

# Run specific collections
pnpm run test:auth
pnpm run test:admission
pnpm run test:api
```

## Security Rule
Never commit populated Postman environments containing live JWTs, passwords, or production secrets. Commit templates only.
