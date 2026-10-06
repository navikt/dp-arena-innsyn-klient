FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:25@sha256:68eb4385ff71590ff7b0c20d0e46b98b0f1fd663d154d40780565422340b258e AS runtime
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