#!/usr/bin/with-contenv bashio

bashio::log.info "Starting WorkShift Calendar..."

CONFIG_PATH=/data/options.json

export LOG_LEVEL=$(bashio::config 'log_level')
export ADMIN_MODE=$(bashio::config 'admin_mode')
export INGRESS_MODE=true
export EXTERNAL_URL=$(bashio::config 'external_url')

SESSION_SECRET=$(bashio::config 'session_secret')
if [ -z "$SESSION_SECRET" ]; then
    bashio::log.info "Generating session secret..."
    SESSION_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
fi
export SESSION_SECRET

if bashio::services.available "mysql"; then
    bashio::log.info "MySQL service detected, using MySQL database"
    export DATABASE_URL="mysql://$(bashio::services 'mysql' 'username'):$(bashio::services 'mysql' 'password')@$(bashio::services 'mysql' 'host'):$(bashio::services 'mysql' 'port')/workshift"
elif bashio::services.available "postgres"; then
    bashio::log.info "PostgreSQL service detected, using PostgreSQL database"
    export DATABASE_URL="postgresql://$(bashio::services 'postgres' 'username'):$(bashio::services 'postgres' 'password')@$(bashio::services 'postgres' 'host'):$(bashio::services 'postgres' 'port')/workshift"
else
    bashio::log.info "No external database service detected, using SQLite"
    mkdir -p /data/db
    export DATABASE_URL="sqlite:////data/db/workshift.db"
fi

bashio::log.info "Database URL configured"
bashio::log.info "Log level: ${LOG_LEVEL}"
bashio::log.info "Admin mode: ${ADMIN_MODE}"

cd /app

bashio::log.info "Initializing database..."
python3 -c "from app import db; db.create_all()"

bashio::log.info "Starting web server on port 8099..."
exec python3 -m gunicorn \
    --bind 0.0.0.0:8099 \
    --workers 2 \
    --access-logfile - \
    --error-logfile - \
    --log-level "${LOG_LEVEL}" \
    "app:app"
