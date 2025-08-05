import { gmail_v1 } from '@googleapis/gmail';

export interface ThreadData {
  id: string;
  messages: gmail_v1.Schema$Message[];
}
