import { createClient, Client } from '@libsql/client';

let client: Client | null = null;

export function getTursoClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || 'libsql://employee-management-prithibi.aws-ap-south-1.turso.io';
    const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJnaWQiOiJlNzY5NTNhMy03MmFhLTQxNDItYjBkYy0yZWZmZDBhZDhlZTgiLCJpYXQiOjE3OTEzNzg5NzIsImtpZCI6IkhIcTdRR2U4QXdJbFVvVjQ0WWtBNlV0aG55RUhhbnB4RUhMblJtamprN1UiLCJyaWQiOiJjODIyOTFkZi1kODM3LTRjODEtOWVjNC0zZWRjYTQ3YTc1ZTUifQ.MCPItPJSxNHi0HKwzqplSxkmpUckScFH7Yz0mtUUn0QxF9dk-Rmp4HzZZDapbCBa5w-YkM2UUgXGGmejs_iYCg';

    client = createClient({
      url,
      authToken,
    });
  }
  return client;
}
