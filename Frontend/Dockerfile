FROM node:18-alpine

WORKDIR /app

# تثبيت التبعات
COPY package*.json ./
RUN npm install

# نسخ الكود وعمل build
COPY . .
RUN npm run build

# بدل ما نستخدم serve، هنستخدم محرك Next.js نفسه
# ده بيخليه يدور على ملفاته في المجلد الصح (.next) أوتوماتيك
EXPOSE 3000

CMD ["npm", "run", "start", "--", "-p", "3000"]