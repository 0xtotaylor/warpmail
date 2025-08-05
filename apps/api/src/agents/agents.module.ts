import { Module } from '@nestjs/common';

import { AgentsService } from './agents.service';
import { SupabaseConfig } from '../config/supabase.config';

@Module({
  providers: [AgentsService, SupabaseConfig],
  exports: [AgentsService],
})
export class AgentsModule {}
