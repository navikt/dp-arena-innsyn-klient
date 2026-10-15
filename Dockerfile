FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:25@sha256:697342eb4d6e50600181d64717fbbbdfc94758a41b1c568971b0308b1d283727 AS runtime
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