ARG BUILD_FROM
FROM $BUILD_FROM

RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-wheel \
    python3-dev \
    gcc \
    musl-dev \
    libffi-dev \
    openssl-dev

WORKDIR /app

COPY requirements.txt .
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

COPY app.py .
COPY main.py .
COPY models.py .
COPY routes.py .
COPY local_auth.py .
COPY templates/ templates/
COPY static/ static/

COPY rootfs /

RUN chmod a+x /etc/services.d/workshift/run && \
    chmod a+x /etc/services.d/workshift/finish

EXPOSE 8099
