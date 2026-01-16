FROM node:24-slim

# Install dependencies required for Prisma and bcrypt
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

RUN npx prisma validate
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3002

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
