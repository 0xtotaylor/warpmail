import { Module } from '@nestjs/common';

import { AgentsModule } from '../agents/agents.module';
import { EmbeddingsService } from './embeddings.service';
import { SupabaseConfig } from '../config/supabase.config';

@Module({
  imports: [AgentsModule],
  providers: [EmbeddingsService, SupabaseConfig],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
