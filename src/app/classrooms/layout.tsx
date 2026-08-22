import { TeacherShell } from '@/components/teacher/TeacherShell';

export const dynamic = 'force-dynamic';

export default function ClassroomsLayout({ children }: { children: React.ReactNode }) {
  return <TeacherShell>{children}</TeacherShell>;
}
