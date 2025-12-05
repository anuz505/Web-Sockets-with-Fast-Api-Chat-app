# base image
FROM python:3.14-slim

# working directory
WORKDIR /app

# install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*


COPY ./server/app/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# copy application code 
# This copies: api/, core/, db/, models/, main.py, .env
COPY ./server/app/ ./

ENV PYTHONPATH=/app

EXPOSE 8000

# run fastapi server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]