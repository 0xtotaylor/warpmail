import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseConfig extends SupabaseClient {
  constructor(private configService: ConfigService) {
    super(
      configService.getOrThrow<string>('SUPABASE_URL'),
      configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  public withAccessToken(accessToken: string): SupabaseClient {
    return createClient(
      this.configService.getOrThrow<string>('SUPABASE_URL'),
      this.configService.getOrThrow<string>('SUPABASE_ANON_KEY'),
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      },
    );
  }
}
