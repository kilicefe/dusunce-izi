import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding development database...');

  // 1. Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dusunceizi.edu.tr' },
    update: {},
    create: {
      email: 'admin@dusunceizi.edu.tr',
      name: 'Sistem Yöneticisi',
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // 2. Teacher User
  const teacher = await prisma.user.upsert({
    where: { email: 'ogretmen@dusunceizi.edu.tr' },
    update: {},
    create: {
      email: 'ogretmen@dusunceizi.edu.tr',
      name: 'Örnek Öğretmen',
      role: Role.TEACHER,
    },
  });
  console.log('✅ Teacher user created:', teacher.email);

  // 3. School
  const school = await prisma.school.upsert({
    where: { code: 'IST-ATATURK-01' },
    update: {},
    create: {
      name: 'Atatürk Ortaokulu',
      code: 'IST-ATATURK-01',
      city: 'İstanbul',
      district: 'Kadıköy',
    },
  });

  // 4. Classroom
  const existingClassroom = await prisma.classroom.findFirst({
    where: {
      teacherId: teacher.id,
      schoolId: school.id,
      name: '8-A Fen Bilimleri',
      grade: '8',
      branch: 'A',
      academicYear: '2025-2026',
    },
  });
  const classroom = existingClassroom || await prisma.classroom.create({
    data: {
      teacherId: teacher.id,
      schoolId: school.id,
      name: '8-A Fen Bilimleri',
      grade: '8',
      branch: 'A',
      academicYear: '2025-2026',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Classroom created:', classroom.name, 'ID:', classroom.id);

  // 5. Pseudonymous Students
  const students = [
    { schoolNumber: '101', firstName: 'Öğrenci', lastName: '001' },
    { schoolNumber: '102', firstName: 'Öğrenci', lastName: '002' },
    { schoolNumber: '103', firstName: 'Öğrenci', lastName: '003' },
    { schoolNumber: '104', firstName: 'Öğrenci', lastName: '004' },
    { schoolNumber: '105', firstName: 'Öğrenci', lastName: '005' },
  ];

  for (const s of students) {
    await prisma.studentRoster.upsert({
      where: {
        classroomId_schoolNumber: {
          classroomId: classroom.id,
          schoolNumber: s.schoolNumber,
        },
      },
      update: {
        firstName: s.firstName,
        lastName: s.lastName,
      },
      create: {
        classroomId: classroom.id,
        schoolNumber: s.schoolNumber,
        firstName: s.firstName,
        lastName: s.lastName,
      },
    });
  }
  console.log(`✅ ${students.length} pseudonymous students seeded to classroom ${classroom.id}`);

  console.log('✨ Database seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
