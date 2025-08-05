export interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  textContent: string;
  htmlContent: string;
  labels: string[];
  attachments: {
    filename: string;
    mimeType: string;
    size: number;
  }[];
}
