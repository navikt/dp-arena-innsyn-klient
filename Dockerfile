FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:25@sha256:864d1072fb3017662b92d7e4877f26982d63e83df2802214f6c804652982ae13 AS runtime
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