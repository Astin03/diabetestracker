# Build frontend (Vite 8 needs Node >= 22.12)
FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production API + static files
FROM node:24-alpine
WORKDIR /app/backend
ENV NODE_ENV=production
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
EXPOSE 5000
CMD ["node", "src/index.js"]
