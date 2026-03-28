import winston from 'winston';

const transports: winston.transport[] = [
  new winston.transports.Console(),
];

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports,
});
```

Click **File → Save**, then go back to PowerShell Tab 2 and run:
```
cd "C:\Users\dmacm\lissie-booking\booking-system"
git add .
git commit -m "Fix logger for Vercel"
git push origin main