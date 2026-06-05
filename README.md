# System Documentation

## Architecture
- **Frontend**: React 19 + Vite + TailwindCSS 4.
- **Backend**: Express.js REST API with modular routing.
- **Database**: SQLite (via \`better-sqlite3\`) simulating a PostgreSQL-like integration (Production would use actual PostgreSQL with a driver like \`pg\`).
- **Caching**: In-Memory mapping (Simulating Redis logic).
- **Deployment**: Dockerized with a multi-stage \`Dockerfile\`.
- **CI/CD**: GitHub Actions pipeline defined in \`.github/workflows\`.

## Security Implementations (Dirty COW Mitigation)
**Vulnerability**: Dirty COW (CVE-2016-5195)
- **Description**: A privilege escalation vulnerability in the Linux kernel's memory subsystem that incorrectly handles copy-on-write (COW) breakage of private read-only memory mappings.
- **Affected Versions**: Linux kernels prior to 4.8.3, 4.4.26, 4.9-rc1. Older Ubuntu distributions like 14.04 LTS and 16.04 LTS with unpatched kernels (from 2.6.22 up to 4.8.2) were highly vulnerable.
- **Mitigation Stage**: The infrastructure inherently mitigates this OS-level vulnerability as follows:
  1. **Container OS**: We utilize `node:20-alpine` (Alpine Linux) in our Docker deployment. The underlying host kernels running these containers are modernized and patched, making them immune to CVE-2016-5195. 
  2. **CI/CD Host**: The GitHub Actions pipeline runs on `ubuntu-latest` (Ubuntu 22.04 / 24.04), which uses a modern kernel (version 5.15+ or 6.x+) far beyond the vulnerable 4.8 range.
  3. **Verification**: In `.github/workflows/main.yml`, the pipeline runs kernel validation checks (`uname -r`) to explicitly verify the host is running a secure kernel, dumping those details to log artifacts.

## API Endpoints

### Auth
- \`POST /api/auth/register\`: Register a new user. Required schema: \`{ username, password, role }\`. Returns 201.
- \`POST /api/auth/login\`: Authenticate. Sets a secure HttpOnly cookie on success.
- \`POST /api/auth/logout\`: Clear the active session cookie.

### Data
- \`GET /api/data\`: Returns user's items, or all items globally if the JWT payload denotes \`role: admin\`. Leverages caching system with 60000ms TTL.
- \`POST /api/data\`: Creates a secure item owned by the caller. Re-invalidates the data cache.
- \`DELETE /api/data/:id\`: Deletes item. Strictly guarded by \`requireRole('admin')\`.
