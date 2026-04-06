# Stage 1: Build wheels for dependencies
FROM python:3.13-slim AS builder

WORKDIR /app

# Install system build dependencies required for compiling psycopg and others
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Stage 2: Runtime image
FROM python:3.13-slim

WORKDIR /app

# Install minimal runtime dependencies needed for psycopg
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Copy wheels and install
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache /wheels/*

# Copy application source
COPY . .

# Create an unprivileged user and vault directory with correct permissions
RUN useradd -m -s /bin/bash vaultuser \
    && mkdir -p /app/vault \
    && chown -R vaultuser:vaultuser /app

USER vaultuser

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
