import { Module } from '@nestjs/common';

import { ContextService } from './context.service';
import { SupabaseConfig } from '../config/supabase.config';

@Module({
  providers: [ContextService, SupabaseConfig],
  exports: [ContextService],
})
export class ContextModule {}
