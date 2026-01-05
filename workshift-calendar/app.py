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

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
app.url_map.strict_slashes = False

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    'pool_pre_ping': True,
    "pool_recycle": 300,
}

INGRESS_MODE = os.environ.get("INGRESS_MODE", "false").lower() == "true"

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
