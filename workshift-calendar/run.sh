#!/usr/bin/with-contenv bashio

bashio::log.info "Starting WorkShift Calendar..."

ADMIN_MODE=$(bashio::config 'admin_mode')
export ADMIN_MODE

if bashio::config.has_value 'admin_mode'; then
    bashio::log.info "Admin mode: $ADMIN_MODE"
fi

export SESSION_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

if bashio::services.available "mysql"; then
    bashio::log.info "Using MariaDB database"
    export DATABASE_URL="mysql://$(bashio::services 'mysql' 'username'):$(bashio::services 'mysql' 'password')@core-mariadb/$(bashio::services 'mysql' 'database')"
else
    bashio::log.info "Using SQLite database"
    export DATABASE_URL="sqlite:////data/workshift.db"
fi

cd /app
exec python3 main.py
