import { ExtractJwt } from 'passport-jwt';
import { Controller, Post, Body, Request } from '@nestjs/common';

import { SupabaseConfig } from './config/supabase.config';
import { ContextService } from './context/context.service';

@Controller()
export class AppController {
  constructor(
    private readonly supabase: SupabaseConfig,
    private readonly contextService: ContextService,
  ) {}

  @Post('context')
  async getContext(
    @Request() req: Request,
    @Body()
    body: {
      from: any;
      message: string;
    },
  ): Promise<any> {
    const supabase = this.supabase.withAccessToken(
      ExtractJwt.fromAuthHeaderAsBearerToken()(req),
    );

    const { data: user } = await supabase.from('users').select('*').single();

    if (!user) {
      throw new Error('User not found');
    }

    return this.contextService.getContext(body.from, body.message, user.id);
  }
}
