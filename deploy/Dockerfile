FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --no-compile -r requirements.txt

COPY src/ ./src/
COPY app.py .

ENV HOST=0.0.0.0
ENV PORT=7860
ENV V1_MODEL_PATH=/app/src/storage/fishfreshnet_v1.pth
ENV V2_MODEL_PATH=/app/src/storage/fishfreshnet_v2.pth
ENV KMP_DUPLICATE_LIB_OK=TRUE

EXPOSE 7860

CMD ["python", "app.py"]
