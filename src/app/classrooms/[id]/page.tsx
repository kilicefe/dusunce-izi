import { use } from 'react';
import ClassroomDetailClient from './ClassroomDetailClient';

export const dynamic = 'force-dynamic';

export default function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ClassroomDetailClient id={id} />;
}
