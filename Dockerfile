FROM europe-north1-docker.pkg.dev/cgr-nav/pull-through/nav.no/node:26@sha256:088bbf14c900a2d7c6da8a0a7e1f18ece9d0b696e2b4d890abb21cd1742792cf AS runtime
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