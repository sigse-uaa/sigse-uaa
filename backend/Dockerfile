FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ ./src/
RUN mkdir -m 750 /app/uploads && chown node:node /app/uploads

USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
