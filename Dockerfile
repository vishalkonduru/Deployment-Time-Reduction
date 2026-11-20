# Stage 1: Install dependencies and remove development-only packages.
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY server.js ./server.js
COPY src ./src
COPY public ./public

# Jest and Supertest are used by CI, not needed in the deployed image.
RUN npm prune --omit=dev --no-audit --no-fund


# Stage 2: Copy only the production runtime into the final image.
FROM node:20-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=10000

WORKDIR /app

COPY --from=dependencies --chown=node:node /app/package.json ./package.json
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=dependencies --chown=node:node /app/server.js ./server.js
COPY --from=dependencies --chown=node:node /app/src ./src
COPY --from=dependencies --chown=node:node /app/public ./public

EXPOSE 10000

USER node

CMD ["node", "server.js"]
