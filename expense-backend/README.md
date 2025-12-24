# Expense Backend

## Environment variables

The server requires the following environment variables to be set before startup:

- `MONGODB_URI`
- `EMAIL_USER`
- `EMAIL_PASS`

You can set them in your shell or source a local `.env` file:

```bash
export MONGODB_URI="mongodb+srv://..."
export EMAIL_USER="user@example.com"
export EMAIL_PASS="app-password"
```

```bash
set -a
source .env
set +a
```

## Run the server

```bash
npm run start
```

For development with auto-reload:

```bash
npm run dev
```
