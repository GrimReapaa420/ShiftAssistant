ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG=C.UTF-8

RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-wheel \
    postgresql-client \
    gcc \
    musl-dev \
    python3-dev \
    libffi-dev \
    postgresql-dev

WORKDIR /app

COPY requirements.txt /app/
RUN pip3 install --no-cache-dir -r requirements.txt

COPY app.py /app/
COPY main.py /app/
COPY models.py /app/
COPY routes.py /app/
COPY local_auth.py /app/
COPY static/ /app/static/
COPY templates/ /app/templates/
COPY run.sh /

RUN chmod a+x /run.sh

LABEL \
    io.hass.name="WorkShift Calendar" \
    io.hass.description="A powerful shift calendar for Home Assistant" \
    io.hass.type="addon" \
    io.hass.version="1.0.1"

CMD [ "/run.sh" ]
