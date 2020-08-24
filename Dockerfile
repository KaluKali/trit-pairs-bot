FROM node:12

ARG APP_DIR=app
RUN mkdir -p ${APP_DIR}

COPY . ./${APP_DIR}

WORKDIR ${APP_DIR}

RUN npm install

ENV VK_API_KEY=YOUR_API_KEY
ENV DB_HOST=10.10.10.5
ENV DB_NAME=botdb
ENV DB_USER=root
ENV DB_PASS=root
ENV DB_TABLE=users

EXPOSE 3000

CMD ["node", "main.js"]

