FROM node:20.12

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

ADD . .

CMD npm run start