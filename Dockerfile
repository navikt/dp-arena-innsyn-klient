FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:25@sha256:69d927452755497d6f658fbff021657fe4586a1ba7e9938783a6664c22a03185 AS runtime
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