import { Module } from '@nestjs/common';

import { ReceiverService } from './receiver.service';
import { AgentsModule } from '../agents/agents.module';
import { SupabaseConfig } from '../config/supabase.config';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [AgentsModule, EmbeddingsModule],
  providers: [ReceiverService, SupabaseConfig],
  exports: [ReceiverService],
})
export class ReceiverModule {}
