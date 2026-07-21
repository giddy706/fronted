# Project Structure

This project is now separated into frontend and backend directories.

- `frontend/`
  - Contains the static website files
  - `public/` holds the main site frontend assets
  - `admin/` holds the admin dashboard frontend files
  - `academee.themerex.net/` contains additional frontend content

- `backend/`
  - Contains the Node.js backend service
  - `server.js` serves the public frontend and backend APIs
  - `admin-server.js` serves the admin frontend and admin API routes
  - `package.json`, `package-lock.json`, `node_modules/`, `.env`, `server/`, `scripts/`, and database files are in this folder

## Notes

- Run backend commands from the `backend` folder, e.g. `cd backend && npm start`
- The frontend is static and can be deployed separately if needed
