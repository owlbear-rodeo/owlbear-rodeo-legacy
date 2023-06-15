FROM node:16.20.0-alpine3.18 AS builder

RUN mkdir /home/node/app/ && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node package.json ./
COPY --chown=node:node yarn.lock ./

USER node
RUN yarn install --non-interactive --dev && yarn cache clean
COPY ./src/ ./src
COPY ./tsconfig.json ./
RUN yarn run build

FROM builder AS install
ENV NODE_ENV production
WORKDIR /home/node/app
RUN rm -rf ./node_modules && yarn install --non-interactive --prod --frozen-lockfile && yarn cache clean

FROM node:16.20.0-alpine3.18
USER node
ENV NODE_ENV production
WORKDIR /home/node/app
COPY --chown=node:node package.json ./
COPY --chown=node:node yarn.lock ./
COPY --chown=node:node ice.json ./
COPY --chown=node:node --from=builder /home/node/app/build ./build
COPY --chown=node:node --from=install /home/node/app/node_modules ./node_modules

CMD ["node", "--es-module-specifier-resolution=node", "./build/index.js"]