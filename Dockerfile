# Dockerfile
FROM node:18

# ساخت یک پوشه کاری درون کانتینر
WORKDIR /app

# کپی کردن پوشه backend به کانتینر
COPY backend ./backend

# تغییر مسیر به backend
WORKDIR /app/backend

# نصب وابستگی‌ها
RUN npm install

# کامپایل پروژه (در صورت استفاده از TypeScript)
RUN npm run build

# تعیین دستور اجرای نهایی
CMD ["npm", "run", "start:prod"]
