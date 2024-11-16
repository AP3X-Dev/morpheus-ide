export async function createFlaskProject(): Promise<(FileType | FolderType)[]> {
  return [
    {
      id: 'requirements.txt',
      name: 'requirements.txt',
      content: `flask==3.0.0
flask-sqlalchemy==3.1.1
flask-migrate==4.0.5
flask-cors==4.0.0
python-dotenv==1.0.0
pytest==7.4.3
black==23.11.0
flake8==6.1.0`,
      language: 'plaintext'
    },
    {
      id: 'app',
      name: 'app',
      items: [
        {
          id: 'app/__init__.py',
          name: '__init__.py',
          content: `from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import Config

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    # Register blueprints
    from app.main import bp as main_bp
    app.register_blueprint(main_bp)

    # Shell context
    @app.shell_context_processor
    def make_shell_context():
        return {'db': db, 'User': User}

    return app

from app import models`,
          language: 'python'
        },
        {
          id: 'app/models.py',
          name: 'models.py',
          content: `from app import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }`,
          language: 'python'
        },
        {
          id: 'app/main',
          name: 'main',
          items: [
            {
              id: 'app/main/__init__.py',
              name: '__init__.py',
              content: `from flask import Blueprint

bp = Blueprint('main', __name__)

from app.main import routes`,
              language: 'python'
            },
            {
              id: 'app/main/routes.py',
              name: 'routes.py',
              content: `from flask import jsonify, request
from app.main import bp
from app.models import User
from app import db

@bp.route('/')
def index():
    return jsonify({'message': 'Welcome to Flask API'})

@bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@bp.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    
    if not data or 'username' not in data or 'email' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
        
    user = User(username=data['username'], email=data['email'])
    db.session.add(user)
    
    try:
        db.session.commit()
        return jsonify(user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@bp.route('/users/<int:id>', methods=['GET'])
def get_user(id):
    user = User.query.get_or_404(id)
    return jsonify(user.to_dict())

@bp.route('/users/<int:id>', methods=['PUT'])
def update_user(id):
    user = User.query.get_or_404(id)
    data = request.get_json()
    
    if 'username' in data:
        user.username = data['username']
    if 'email' in data:
        user.email = data['email']
        
    try:
        db.session.commit()
        return jsonify(user.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@bp.route('/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    user = User.query.get_or_404(id)
    db.session.delete(user)
    
    try:
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400`,
              language: 'python'
            }
          ]
        }
      ]
    },
    {
      id: 'config.py',
      name: 'config.py',
      content: `import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False`,
      language: 'python'
    },
    {
      id: '.env',
      name: '.env',
      content: `SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///app.db`,
      language: 'plaintext'
    },
    {
      id: '.flaskenv',
      name: '.flaskenv',
      content: `FLASK_APP=run.py
FLASK_ENV=development
FLASK_DEBUG=1`,
      language: 'plaintext'
    },
    {
      id: 'run.py',
      name: 'run.py',
      content: `from app import create_app, db
from app.models import User

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)`,
      language: 'python'
    },
    {
      id: 'tests',
      name: 'tests',
      items: [
        {
          id: 'tests/__init__.py',
          name: '__init__.py',
          content: '',
          language: 'python'
        },
        {
          id: 'tests/conftest.py',
          name: 'conftest.py',
          content: `import pytest
from app import create_app, db
from app.models import User
from config import Config

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite://'

@pytest.fixture
def app():
    app = create_app(TestConfig)
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()`,
          language: 'python'
        },
        {
          id: 'tests/test_models.py',
          name: 'test_models.py',
          content: `from app.models import User
from app import db

def test_new_user():
    user = User(username='test', email='test@example.com')
    assert user.username == 'test'
    assert user.email == 'test@example.com'

def test_user_to_dict():
    user = User(username='test', email='test@example.com')
    db.session.add(user)
    db.session.commit()
    
    user_dict = user.to_dict()
    assert user_dict['username'] == 'test'
    assert user_dict['email'] == 'test@example.com'
    assert 'id' in user_dict
    assert 'created_at' in user_dict`,
          language: 'python'
        },
        {
          id: 'tests/test_routes.py',
          name: 'test_routes.py',
          content: `import json
from app.models import User
from app import db

def test_index(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'Welcome to Flask API' in response.data

def test_create_user(client):
    response = client.post('/users',
        json={'username': 'test', 'email': 'test@example.com'})
    assert response.status_code == 201
    
    data = json.loads(response.data)
    assert data['username'] == 'test'
    assert data['email'] == 'test@example.com'

def test_get_users(client):
    # Create test user
    user = User(username='test', email='test@example.com')
    db.session.add(user)
    db.session.commit()
    
    response = client.get('/users')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert len(data) == 1
    assert data[0]['username'] == 'test'`,
          language: 'python'
        }
      ]
    },
    {
      id: '.gitignore',
      name: '.gitignore',
      content: `*.py[cod]
__pycache__
.pytest_cache
*.so
.Python
env/
venv/
.env
*.db
.DS_Store
.coverage
htmlcov/
.idea/
.vscode/`,
      language: 'plaintext'
    },
    {
      id: 'README.md',
      name: 'README.md',
      content: `# Flask API Project

A modern Flask API with SQLAlchemy, migrations, and testing.

## Setup

1. Create a virtual environment:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. Initialize the database:
   \`\`\`bash
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   \`\`\`

4. Run the development server:
   \`\`\`bash
   flask run
   \`\`\`

## Testing

Run tests with pytest:
\`\`\`bash
pytest
\`\`\`

## API Endpoints

- GET /: Welcome message
- GET /users: List all users
- POST /users: Create a new user
- GET /users/<id>: Get user by ID
- PUT /users/<id>: Update user
- DELETE /users/<id>: Delete user

## Project Structure

\`\`\`
├── app/
│   ├── __init__.py
│   ├── models.py
│   └── main/
│       ├── __init__.py
│       └── routes.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_models.py
│   └── test_routes.py
├── config.py
├── run.py
├── requirements.txt
└── README.md
\`\`\``,
      language: 'markdown'
    }
  ];
}