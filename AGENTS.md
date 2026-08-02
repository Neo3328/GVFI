# GVFI

## Cursor Cloud specific instructions

### Current state of the repo
- This repository is currently a **placeholder / greenfield** project. The only runnable artifact is a single static page, `index.html` (a "Stargazers log" stub). `README.md` describes the intended product as "GVFI — a video image optimization software", but **no product source code, package manager, build system, lint config, or tests exist yet**.
- There is no `package.json`, `requirements.txt`, `Dockerfile`, `Makefile`, or similar. Nothing needs to be installed to work with the current contents.

### Running the site in development
- The app is a static HTML page, so serve it with any static file server. Python 3 (pre-installed) is the simplest:
  - From the repo root: `python3 -m http.server 8000`
  - Then open `http://localhost:8000/`.
- Node 22 and npm are also available if a JS/TS toolchain is added later.

### Lint / test / build
- None exist yet. There is nothing to lint, test, or build for the current repo state. If/when a real toolchain is added (e.g. a `package.json`), update this section and the environment update script accordingly.
