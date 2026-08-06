import { getStudentAttemptData } from '@/app/actions/studentExamActions';
import { StudentExamPortal } from './StudentExamPortal';

export const dynamic = 'force-dynamic';

export default async function TakeExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ shortCode: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams.token || `token-${resolvedParams.shortCode}`;
  const attemptData = await getStudentAttemptData(token);

  return <StudentExamPortal initialAttempt={attemptData} token={token} />;
}
