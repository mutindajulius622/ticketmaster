# Database Migrations for Seat Reservation Fields

This project uses `Flask-Migrate` (Alembic) for database migrations.

A migration stub has been added at:

- `backend/migrations/versions/0001_add_seat_reserved_fields.py`

It adds two columns to the `seats` table:

- `reserved_by` (String(36), FK -> `users.id`)
- `reserved_until` (DateTime, indexed)

## How to apply the migration (recommended)

1. Ensure your virtualenv is active and dependencies installed:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Initialize migrations (if not already):

```bash
flask db init
```

3. If the `migrations/versions/0001_add_seat_reserved_fields.py` file already exists (it does in this repo), you can apply it with:

```bash
flask db upgrade
```

4. Verify schema changes (psql or database client) or by running the app and inspecting models.

## If you prefer a manual SQL approach

Run SQL commands similar to (Postgres example):

```sql
ALTER TABLE seats ADD COLUMN reserved_by VARCHAR(36);
ALTER TABLE seats ADD COLUMN reserved_until TIMESTAMP;
ALTER TABLE ONLY seats ADD CONSTRAINT fk_seats_reserved_by_users FOREIGN KEY (reserved_by) REFERENCES users (id);
CREATE INDEX ix_seats_reserved_until ON seats (reserved_until);
```

## Notes

- If your project already has migrations history, ensure `down_revision` in the migration file matches the last revision.
- Always run migrations in a safe environment and back up your database before applying schema changes in production.
