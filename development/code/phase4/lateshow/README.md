# Late Show API

A Flask REST API for managing episodes and guest appearances on a late-night talk show.

## Table of Contents

- [Features](#features)
- [Setup](#setup)
- [Running the Application](#running-the-application)
- [Database Seeding](#database-seeding)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Technologies Used](#technologies-used)

## Features

- **Episode Management**: Create and retrieve episodes with their air date and episode number
- **Guest Management**: Manage guest information including name and occupation
- **Appearance Tracking**: Track guest appearances on episodes with ratings
- **Data Validation**: Rating validation (1-5 scale) with comprehensive error handling
- **RESTful API**: Clean, intuitive endpoints following REST conventions
- **Database Relationships**: Proper ORM relationships with cascade delete support
- **Serialization**: Controlled JSON serialization to prevent infinite recursion

## Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd lateshow
```

2. **Create a virtual environment**

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Create instance directory**

```bash
mkdir instance
```

## Running the Application

### Start the Flask development server

```bash
python run.py
```

The API will be available at `http://localhost:5000`

## Database Seeding

### Seed the database with sample data

```bash
python seed.py
```

This will populate the database with sample episodes, guests, and appearances.

### Reset the database

To reset the database and start fresh:

```bash
rm instance/app.db
python seed.py
```

## API Endpoints

### GET /episodes

Returns a list of all episodes.

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "date": "1/11/99",
    "number": 1
  },
  {
    "id": 2,
    "date": "1/12/99",
    "number": 2
  }
]
```

### GET /episodes/:id

Returns a specific episode with all its appearances.

**Response (200 OK):**

```json
{
  "id": 1,
  "date": "1/11/99",
  "number": 1,
  "appearances": [
    {
      "id": 1,
      "rating": 4,
      "guest_id": 1,
      "episode_id": 1,
      "guest": {
        "id": 1,
        "name": "Michael J. Fox",
        "occupation": "actor"
      }
    }
  ]
}
```

**Response (404 Not Found):**

```json
{
  "error": "Episode not found"
}
```

### GET /guests

Returns a list of all guests.

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "Michael J. Fox",
    "occupation": "actor"
  },
  {
    "id": 2,
    "name": "Sandra Bernhard",
    "occupation": "Comedian"
  },
  {
    "id": 3,
    "name": "Tracey Ullman",
    "occupation": "television actress"
  }
]
```

### POST /appearances

Creates a new appearance linking a guest to an episode.

**Request Body:**

```json
{
  "rating": 5,
  "episode_id": 2,
  "guest_id": 3
}
```

**Response (201 Created):**

```json
{
  "id": 162,
  "rating": 5,
  "guest_id": 3,
  "episode_id": 2,
  "episode": {
    "date": "1/12/99",
    "id": 2,
    "number": 2
  },
  "guest": {
    "id": 3,
    "name": "Tracey Ullman",
    "occupation": "television actress"
  }
}
```

**Response (400 Bad Request):**

```json
{
  "errors": ["Rating must be an integer between 1 and 5"]
}
```

## Testing

### Using Postman

1. Import the provided Postman collection: `challenge-4-lateshow.postman_collection.json`
2. Set the base URL to `http://localhost:5000`
3. Run the requests to test all endpoints

### Manual Testing with cURL

```bash
# Get all episodes
curl http://localhost:5000/episodes

# Get a specific episode
curl http://localhost:5000/episodes/1

# Get all guests
curl http://localhost:5000/guests

# Create an appearance
curl -X POST http://localhost:5000/appearances \
  -H "Content-Type: application/json" \
  -d '{"rating": 5, "episode_id": 2, "guest_id": 3}'
```

## Database Models

### Episode

- **id** (Integer): Primary key
- **date** (String): Air date of the episode
- **number** (Integer): Episode number
- **appearances** (Relationship): Many appearances

### Guest

- **id** (Integer): Primary key
- **name** (String): Guest's full name
- **occupation** (String): Guest's occupation/profession
- **appearances** (Relationship): Many appearances

### Appearance

- **id** (Integer): Primary key
- **rating** (Integer): Rating of the appearance (1-5)
- **guest_id** (Foreign Key): Reference to Guest
- **episode_id** (Foreign Key): Reference to Episode
- **guest** (Relationship): Associated guest
- **episode** (Relationship): Associated episode

### Relationships

- An Episode has many Guests through Appearance
- A Guest has many Episodes through Appearance
- An Appearance belongs to a Guest and an Episode
- Cascade delete is configured to remove appearances when guest or episode is deleted

## Validations

### Appearance Validations

- **rating**: Must be an integer between 1 and 5 (inclusive)
  - Raises `ValueError` if validation fails
  - Returns 400 status with error message if invalid

## Technologies Used

- **Flask 2.3.3**: Lightweight web framework
- **SQLAlchemy 2.0.21**: ORM for database operations
- **Flask-SQLAlchemy 3.0.5**: SQLAlchemy integration with Flask
- **Flask-Migrate 4.0.5**: Database migration tool
- **sqlalchemy-serializer 1.4.1**: JSON serialization for models
- **Python 3.8+**: Programming language

## Project Structure

```
lateshow/
├── app/
│   ├── __init__.py          # Application factory
│   ├── models.py            # Database models
│   └── routes.py            # API routes
├── seed_data/
│   ├── guests.csv           # Guest seed data
│   ├── episodes.csv         # Episode seed data
│   └── appearances.csv      # Appearance seed data
├── instance/                # Instance-specific files (created at runtime)
│   └── app.db               # SQLite database
├── config.py                # Configuration settings
├── requirements.txt         # Python dependencies
├── run.py                   # Application entry point
├── seed.py                  # Database seeding script
└── README.md                # This file
```

## Development Notes

### Creating Migrations

If you modify the models, create new migrations:

```bash
flask db migrate -m "Description of changes"
flask db upgrade
```

### Environment Variables

Create a `.env` file for local development:

```env
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here
```

## Troubleshooting

### Database Issues

**Issue**: `sqlite3.OperationalError: no such table`

**Solution**: Run the seed script to initialize the database:
```bash
python seed.py
```

### Import Errors

**Issue**: `ModuleNotFoundError: No module named 'flask'`

**Solution**: Ensure virtual environment is activated and dependencies are installed:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

## License

This is an educational project for the Moringa School Phase 4 Code Challenge.

## Support

For issues or questions, please contact the development team or refer to the course materials.
