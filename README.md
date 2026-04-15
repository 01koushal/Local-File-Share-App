# Local File Share App

A simple full-stack app for sharing files over your local network.

Upload a file from the browser, get a generated download link, and send that link to someone on the same network.

## Features

- Drag-and-drop or browse to select a file
- Upload progress indicator
- Copyable download link after upload
- Express API for file upload and download
- React frontend
- Docker Compose setup for running both services together

## Tech Stack

- Frontend: React
- Backend: Node.js, Express, Multer
- Containerization: Docker, Docker Compose

## Project Structure

```text
.
|-- client/
|   |-- public/
|   |-- src/
|   `-- Dockerfile
|-- server/
|   |-- src/
|   |-- uploads/
|   `-- Dockerfile
|-- docker-compose.yml
`-- README.md
```

## How It Works

1. The React frontend lets the user select a file.
2. The file is uploaded to the Express backend.
3. The backend stores the file in `server/uploads/`.
4. The backend returns a generated download URL.
5. Anyone with that link can download the file from the server.

## Requirements

- Node.js 20+ recommended
- npm
- Docker Desktop (optional, if using Docker)

## Run Locally

Open two terminals.

### Backend

```powershell
cd "d:\Devops\Local File Share App\server"
npm install
npm run dev
```

The API starts on `http://localhost:5000`.

### Frontend

```powershell
cd "d:\Devops\Local File Share App\client"
npm install
$env:PORT=4173
npm start
```

Open the app in your browser:

```text
http://localhost:4173
```

If you want to access it from another device on the same network, replace `localhost` with your machine's local IP address.

## Run With Docker Compose

From the project root:

```powershell
docker compose up --build
```

This starts:

- Frontend on `http://localhost:3000`
- Backend on `http://localhost:5000`

To stop the containers:

```powershell
docker compose down
```

## Environment Variables

### Backend

Configured in `docker-compose.yml` or your shell:

- `PORT`: backend port, default `5000`
- `CLIENT_ORIGIN`: allowed frontend origin for CORS
- `PUBLIC_BASE_URL`: public base URL used to build download links
- `MAX_FILE_SIZE_MB`: max upload size in MB, default `10`

### Frontend

- `REACT_APP_API_BASE_URL`: backend base URL used by the React app
- `HOST`: host binding for the dev server
- `PORT`: frontend port

## API Endpoints

- `GET /health`: health check
- `POST /upload`: upload a single file using form field `file`
- `GET /files/:filename`: download a file by generated filename

## Notes

- Uploaded files are stored on disk in `server/uploads/`.
- There is no authentication or file expiry yet.
- This project is best suited for local or small controlled-network usage in its current form.
- The current client Docker setup runs the React development server. It works for local use, but for production deployment you would usually build the frontend and serve the static files with Nginx or another web server.

## Troubleshooting

### Port already in use

If `3000`, `4173`, or `5000` is already in use, stop the other process using that port or change the port in your environment variables.

### Cannot open from another device

- Make sure both frontend and backend are running
- Use your machine's local IP instead of `localhost`
- Check firewall settings
- Make sure the backend `CLIENT_ORIGIN` allows the frontend URL

## Future Improvements

- Authentication and access control
- File expiry or auto-delete
- Share codes instead of raw URLs
- Production-ready frontend container setup
- Reverse proxy and HTTPS support
