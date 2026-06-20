version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: pwa_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
      POSTGRES_DB: pwa_app
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - pwa_network

  redis:
    image: redis:7-alpine
    container_name: pwa_redis
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - pwa_network

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: pwa_backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      REDIS_HOST: redis
    ports:
      - "5000:5000"
    depends_on:
      - postgres
      - redis
    networks:
      - pwa_network

volumes:
  postgres_data:
  redis_data:

networks:
  pwa_network:
    driver: bridge