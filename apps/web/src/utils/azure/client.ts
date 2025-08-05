import { ServiceBusClient } from "@azure/service-bus";

export function getServiceBusClient() {
  return new ServiceBusClient(process.env.SERVICEBUS_CONNECTION_STRING!);
}
