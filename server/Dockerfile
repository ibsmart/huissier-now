FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm install

# Copier le reste du code
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Compiler TypeScript
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
