import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

export const redisFactory = (configService: ConfigService) => {
  return new Redis({
    host: configService.get('REDIS_HOST'),
    password: configService.get('REDIS_PASSWORD'),
    port: parseInt(configService.get('REDIS_PORT')),
    ...(configService.get('ENVIRONMENT') !== 'dev'
      ? {
          tls: { servername: configService.get('REDIS_HOST') },
        }
      : {}),
  });
};
