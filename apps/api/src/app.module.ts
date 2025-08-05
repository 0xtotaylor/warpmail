import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';

import { AppController } from './app.controller';
import { SentryModule } from '@sentry/nestjs/setup';
import { AgentsModule } from './agents/agents.module';
import { ContextModule } from './context/context.module';
import { SupabaseConfig } from './config/supabase.config';
import { ReceiverModule } from './receiver/receiver.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SentryModule.forRoot(),
    HttpModule,
    AgentsModule,
    ContextModule,
    ReceiverModule,
    EmbeddingsModule,
  ],
  controllers: [AppController],
  providers: [
    SupabaseConfig,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
