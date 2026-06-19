import { withAuth } from '@workos-inc/authkit-nextjs';

export async function requireFinanceReportAuth() {
  const { user } = await withAuth({ ensureSignedIn: false });
  return user;
}

export function isGeneratedReportRequest(body: {
  source?: string;
  url?: string;
  doc?: { text?: string };
}): boolean {
  if (body.source === 'url') return true;
  if (body.source === 'upload' && body.doc?.text?.trim()) return true;
  return false;
}