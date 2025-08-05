import { ConfigService } from '@nestjs/config';
import { ServiceBusClient } from '@azure/service-bus';

export const getServiceBusClient = (configService: ConfigService) => {
  return new ServiceBusClient(
    configService.get('SERVICEBUS_CONNECTION_STRING')!,
  );
};
