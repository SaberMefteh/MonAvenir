FROM node:20-alpine
WORKDIR /server

COPY package.json package-lock.json ./

RUN npm ci

COPY . .


EXPOSE 5000

CMD ["node", "index.js"]

