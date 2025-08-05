import { Redis } from "ioredis";

export function getRedisClient() {
  return new Redis({
    host: process.env.REDIS_HOST!,
    password: process.env.REDIS_PASSWORD,
    port: parseInt(process.env.REDIS_PORT!),
    ...(process.env.NODE_ENV !== "development"
      ? {
          tls: { servername: process.env.REDIS_HOST },
        }
      : {}),
  });
}
