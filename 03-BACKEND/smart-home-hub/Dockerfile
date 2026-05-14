FROM --platform=linux/amd64 python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
COPY services/ ./services/
COPY simple/ ./simple/
COPY routes/ ./routes/
COPY static/ ./static/
COPY templates/ ./templates/
COPY MY_DEVICES.py MY_RULES.py main.py default_rules.json ./

RUN mkdir -p data logs

EXPOSE 5000

CMD ["python", "main.py"]
