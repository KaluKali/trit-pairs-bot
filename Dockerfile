FROM node:12

ARG APP_DIR=app
RUN mkdir -p ${APP_DIR}

COPY . ./${APP_DIR}

RUN npm install

WORKDIR ${APP_DIR}

EXPOSE 3000

CMD ["node", "main"]

