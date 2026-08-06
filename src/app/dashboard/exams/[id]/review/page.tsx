import { requireTeacher } from '@/lib/auth';
import { getExamReviewList } from '@/app/actions/multimodalActions';
import { ReviewWorkspace } from './ReviewWorkspace';

export const dynamic = 'force-dynamic';

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireTeacher();
  const resolvedParams = await params;
  const responses = await getExamReviewList(resolvedParams.id);

  return <ReviewWorkspace examId={resolvedParams.id} initialResponses={responses} />;
}
