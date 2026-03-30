# Backend Setup

## Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT auth
- Multer local uploads
- Stripe placeholder integration

## Available Modules

- Auth
- Users
- Categories
- Products
- Reviews
- Uploads

## Local Setup

1. Copy `.env.example` to `.env`
2. Install dependencies with `npm install`
3. Start MongoDB
4. Run `npm run dev`

## Notes

- Images are stored in `backend/uploads/`
- Guest checkout is disabled by product requirement
- Admin and customer share the same `users` collection and are separated by role checks
- Stripe, shipping, POS, and email providers can be expanded once credentials are available
