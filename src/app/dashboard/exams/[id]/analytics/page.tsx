import { requireTeacher } from '@/lib/auth';
import { getExamAnalyticsData } from '@/app/actions/analyticsActions';
import { ExamAnalyticsView } from './ExamAnalyticsView';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireTeacher();
  const resolvedParams = await params;
  const analytics = await getExamAnalyticsData(resolvedParams.id);

  return <ExamAnalyticsView examId={resolvedParams.id} analytics={analytics} />;
}
