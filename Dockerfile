FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir gunicorn

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_APP=main.py
ENV FLASK_ENV=production
ENV ADMIN_MODE=true

ARG PORT=5000
ENV PORT=${PORT}

EXPOSE ${PORT}

CMD gunicorn --bind 0.0.0.0:${PORT} --workers 2 --threads 4 main:app
