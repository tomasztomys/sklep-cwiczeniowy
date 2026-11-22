# Sklep ćwiczeniowy: obraz dla linux/amd64 i linux/arm64 (specyfikacja K-1–K-9).
FROM node:26-alpine

LABEL org.opencontainers.image.source="https://github.com/tomasztomys/sklep-cwiczeniowy" \
      org.opencontainers.image.description="Sklep ćwiczeniowy do książki o testach automatycznych" \
      org.opencontainers.image.licenses="UNLICENSED"

ENV NODE_ENV=production \
    PORT=3000 \
    SKLEP_DANE_STARTOWE=tak \
    SKLEP_BLEDY=""

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY src ./src
COPY publiczne ./publiczne

USER node
EXPOSE 3000

# Limit czasu powyżej 3 s, bo tryb wolne-api opóźnia też /api/health (K-3).
HEALTHCHECK --interval=5s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["node", "src/serwer.ts"]
