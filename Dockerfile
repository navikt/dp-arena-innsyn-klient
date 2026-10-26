FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:25@sha256:72d72f1655a5ca78a92bf975380a9b57f5feb6e6190b1bf33c4bdeba9bf730c5 AS runtime
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