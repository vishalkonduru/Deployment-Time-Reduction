FROM node:20-alpine

ENV NODE_ENV=production
ENV PORT=10000
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY server.js ./server.js
COPY src ./src
COPY public ./public

EXPOSE 10000
USER node
CMD ["node", "server.js"]
