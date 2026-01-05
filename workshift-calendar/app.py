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
        return self.app(environ, start_response)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")
app.wsgi_app = IngressMiddleware(ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1))
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

with app.app_context():
    import models
    db.create_all()
    logging.info("Database tables created")
