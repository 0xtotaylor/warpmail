import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceBusClient } from '@azure/service-bus';

@Injectable()
export class ServiceBusConfig extends ServiceBusClient {
  constructor(private configService: ConfigService) {
    super(configService.getOrThrow<string>('SERVICEBUS_CONNECTION_STRING'));
  }
}
