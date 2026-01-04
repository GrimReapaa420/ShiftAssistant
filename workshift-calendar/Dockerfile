ARG BUILD_FROM
FROM $BUILD_FROM

WORKDIR /app

RUN apk add --no-cache \
    postgresql-client \
    postgresql-dev \
    gcc \
    musl-dev \
    python3-dev

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY app.py .
COPY main.py .
COPY models.py .
COPY routes.py .
COPY local_auth.py .
COPY templates/ templates/
COPY static/ static/

COPY run.sh /
RUN chmod a+x /run.sh

CMD ["/run.sh"]
