FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:26@sha256:af2a360f0c74e10987a12fef94aa24499806aea95d3720cc1580aff29cf0ec88 AS runtime
WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV TZ="Europe/Oslo"
EXPOSE 3000

COPY ./public ./public/
COPY ./package.json ./package.json
COPY ./build/ ./build/
COPY ./node_modules ./node_modules

CMD ["./node_modules/@react-router/serve/dist/cli.js", "./build/server/index.js"]