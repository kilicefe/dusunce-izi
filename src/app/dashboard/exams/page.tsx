import { requireTeacher } from '@/lib/auth';
import { listExams } from '@/app/actions/examActions';
import { listClassrooms } from '@/app/actions/classroomActions';
import { ExamManager } from './ExamManager';

export const dynamic = 'force-dynamic';

export default async function ExamsPage() {
  await requireTeacher();

  const [exams, classrooms] = await Promise.all([
    listExams(),
    listClassrooms(),
  ]);

  return (
    <ExamManager
      initialExams={exams}
      classrooms={classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        branch: c.branch,
      }))}
    />
  );
}
