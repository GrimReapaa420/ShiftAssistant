from flask import Flask, request, redirect
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
import os
from werkzeug.middleware.proxy_fix import ProxyFix
import logging

log_level = os.environ.get("LOG_LEVEL", "info").upper()
logging.basicConfig(level=getattr(logging, log_level, logging.INFO))

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

INGRESS_MODE = os.environ.get("INGRESS_MODE", "false").lower() == "true"

class IngressMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        path_info = environ.get('PATH_INFO', '/')
        while '//' in path_info:
            path_info = path_info.replace('//', '/')
        if not path_info:
            path_info = '/'
        environ['PATH_INFO'] = path_info
        
        if INGRESS_MODE:
            ingress_path = environ.get('HTTP_X_INGRESS_PATH', '')
            if ingress_path:
                ingress_path = ingress_path.rstrip('/')
                environ['SCRIPT_NAME'] = ingress_path
                logging.debug(f"Ingress path set to: {ingress_path}")
        return self.app(environ, start_response)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")
app.wsgi_app = ProxyFix(IngressMiddleware(app.wsgi_app), x_for=1, x_proto=1, x_host=1, x_prefix=0)
app.url_map.strict_slashes = False

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    'pool_pre_ping': True,
    "pool_recycle": 300,
}

@app.context_processor
def inject_ingress_path():
    if INGRESS_MODE:
        ingress_path = request.headers.get('X-Ingress-Path', '')
        return {'ingress_path': ingress_path, 'ingress_mode': True}
    return {'ingress_path': '', 'ingress_mode': False}

db.init_app(app)

def run_migrations():
    """Run database migrations for schema changes."""
    from sqlalchemy import inspect, text
    
    inspector = inspect(db.engine)
    
    # Check if day_notes table exists
    if 'day_notes' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('day_notes')]
        
        # Add position column if missing (added in v1.0.9)
        if 'position' not in columns:
            logging.info("Migrating day_notes table: adding position column...")
            with db.engine.begin() as conn:
                # Use dialect-appropriate SQL
                if 'sqlite' in str(db.engine.url):
                    conn.execute(text("ALTER TABLE day_notes ADD COLUMN position VARCHAR(20) DEFAULT 'top'"))
                else:
                    conn.execute(text("ALTER TABLE day_notes ADD COLUMN position VARCHAR(20) DEFAULT 'top'"))
                conn.execute(text("UPDATE day_notes SET position = 'top' WHERE position IS NULL"))
            logging.info("Migration complete: position column added to day_notes")

with app.app_context():
    import models
    run_migrations()
    db.create_all()
    logging.info("Database tables created")
