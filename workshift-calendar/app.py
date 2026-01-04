from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
import os
import logging

logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    'pool_pre_ping': True,
    "pool_recycle": 300,
}

class IngressMiddleware:
    """
    WSGI middleware that sets SCRIPT_NAME from X-Ingress-Path header.
    This makes Flask's url_for() generate correct URLs for Home Assistant ingress.
    
    Important: We ONLY set SCRIPT_NAME, we do NOT modify PATH_INFO.
    Home Assistant ingress already strips the prefix before forwarding.
    """
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        ingress_path = environ.get('HTTP_X_INGRESS_PATH', '')
        if ingress_path:
            environ['SCRIPT_NAME'] = ingress_path.rstrip('/')
        return self.app(environ, start_response)

app.wsgi_app = IngressMiddleware(app.wsgi_app)

db.init_app(app)

@app.context_processor
def inject_ingress_path():
    ingress_path = request.headers.get('X-Ingress-Path', '')
    return dict(ingress_path=ingress_path)

with app.app_context():
    import models
    db.create_all()
    logging.info("Database tables created")
