# Vercel Deployment Guide 🚀

To deploy the **Ticket Master** application to Vercel, follow these steps:

## 1. Prerequisites
- A [Vercel](https://vercel.com) account.
- A PostgreSQL database (e.g., [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Supabase](https://supabase.com), or [Neon](https://neon.tech)).
- SMTP credentials for email (e.g., Gmail App Password).

## 2. Environment Variables
Add the following environment variables in your Vercel Project Settings:

### Backend (Vercel Settings -> Environment Variables)
| Variable | Value (Example) |
| :--- | :--- |
| `DATABASE_URL` | `postgres://user:pass@host:port/dbname` |
| `JWT_SECRET_KEY` | (Generate a random string) |
| `FLASK_ENV` | `production` |
| `CORS_ORIGINS` | `https://your-app-url.vercel.app` |
| `FRONTEND_URL` | `https://your-app-url.vercel.app` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your-email@gmail.com` |
| `SMTP_PASS` | `your-app-password` |
| `SMTP_FROM` | `your-email@gmail.com` |
| `PAYPAL_CLIENT_ID` | (Your PayPal Live/Sandbox Client ID) |
| `PAYPAL_CLIENT_SECRET` | (Your PayPal Live/Sandbox Secret) |

### Frontend (Add these as well)
| Variable | Value (Example) |
| :--- | :--- |
| `REACT_APP_API_URL` | `https://your-app-url.vercel.app/api` |

## 3. Deployment Steps
1. Push your code to a GitHub repository.
2. Connect the repository to Vercel.
3. Vercel will auto-detect the configuration from `vercel.json`.
4. Ensure the **Root Directory** is left as the default (root of the repo).
5. Deploy!

## 4. Database Setup
The application is configured to run `db.create_all()` automatically on the first request in production. However, it is recommended to manage your production database using migrations if you plan to make schema changes later.

## 5. Important Notes
- **File Uploads**: Local file storage (the `/uploads` folder) is **not persistent** on Vercel. For product images or profile pictures in production, consider integrating a cloud storage provider like Cloudinary or AWS S3.
- **Cold Starts**: The first request to the API after some inactivity might be slightly slower due to Vercel's serverless "cold start" behavior.
