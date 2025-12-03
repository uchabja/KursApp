import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Students } from './components/Students';
import { Courses } from './components/Courses';
import { Payments } from './components/Payments';
import { ImportExport } from './components/ImportExport';
import { AppData, Course, Student, Payment, PaymentStatus } from './types';
import { getData, generatePaymentsForEnrollment } from './services/storage';
import { Menu } from 'lucide-react';

const API_URL = '/api';

const App: React.FC = () => {
  const [data, setData] = useState<AppData>({ students: [], courses: [], payments: [] });
  const [currentView, setCurrentView] = useState('students');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [studentIdToOpen, setStudentIdToOpen] = useState<string | null>(null);

  // Load data helper
  const refreshData = async () => {
    const loadedData = await getData();
    setData(loadedData);
  };

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, []);

  // --- Actions ---

  const handleAddStudent = async (student: Student) => {
    try {
      await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to add student:', error);
    }
  };

  const handleBulkAddStudents = async (newStudents: Student[]) => {
    // For bulk add, we might want a specific endpoint, but for now loop or use existing
    // Ideally backend should support bulk.
    // Let's loop for simplicity in migration or add a bulk endpoint later.
    // Actually, let's just do it one by one for now or add a bulk endpoint if needed.
    // Given the previous code just did local state update, let's try to add them one by one.
    try {
      for (const student of newStudents) {
        await fetch(`${API_URL}/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(student),
        });
      }
      await refreshData();
    } catch (error) {
      console.error('Failed to bulk add students:', error);
    }
  };

  const handleUpdateStudent = async (student: Student) => {
    try {
      await fetch(`${API_URL}/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to update student:', error);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await fetch(`${API_URL}/students/${id}`, {
        method: 'DELETE',
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to delete student:', error);
    }
  };

  const handleEnrollStudent = async (studentId: string, courseId: string, joinDate: string) => {
    const course = data.courses.find(c => c.id === courseId);
    if (!course) return;

    // Generate payments client-side to send to server (or server can do it)
    // Our server endpoint expects 'payments' array.
    const newPayments = generatePaymentsForEnrollment(studentId, course, joinDate, data.payments);

    try {
      await fetch(`${API_URL}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, courseId, joinDate, payments: newPayments }),
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to enroll student:', error);
    }
  };

  const handleUnenrollStudent = async (studentId: string, courseId: string) => {
    try {
      await fetch(`${API_URL}/unenroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, courseId }),
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to unenroll student:', error);
    }
  };

  const handleTransferStudent = async (studentId: string, oldCourseId: string, newCourseId: string, transferDate: string) => {
    const newCourse = data.courses.find(c => c.id === newCourseId);
    if (!newCourse) return;

    // We need to calculate new payments. 
    // The server endpoint expects 'newPayments'.
    // But wait, generatePaymentsForEnrollment needs 'existingPayments' to check for duplicates.
    // In transfer, we are removing old pending payments.
    // So we should filter them out locally before generating new ones?
    // Or just let the server handle it?
    // The server endpoint logic:
    // 1. Remove pending payments for OLD course.
    // 2. Remove OLD enrollment.
    // 3. Add NEW enrollment.
    // 4. Create NEW payments.

    // So we need to generate payments for the NEW course.
    // We can pass the current payments list, but filtered?
    // Actually, let's just pass the current list. The generator checks for duplicates based on studentId + courseId + period.
    // Since the courseId is different (newCourseId), it won't clash with old course payments.

    const newGeneratedPayments = generatePaymentsForEnrollment(studentId, newCourse, transferDate, data.payments);

    try {
      await fetch(`${API_URL}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          oldCourseId,
          newCourseId,
          transferDate,
          newPayments: newGeneratedPayments
        }),
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to transfer student:', error);
    }
  };

  const handleAddCourse = async (course: Course) => {
    try {
      await fetch(`${API_URL}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course),
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to add course:', error);
    }
  };

  const handleUpdateCourse = async (course: Course) => {
    try {
      await fetch(`${API_URL}/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course),
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to update course:', error);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    try {
      await fetch(`${API_URL}/courses/${id}`, {
        method: 'DELETE',
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  const handleUpdatePaymentStatus = async (paymentId: string, status: PaymentStatus) => {
    try {
      await fetch(`${API_URL}/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          paidDate: status === 'paid' ? new Date().toISOString() : undefined
        }),
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  const handleViewStudentFromCourse = (studentId: string) => {
    setStudentIdToOpen(studentId);
    setCurrentView('students');
  };

  return (
    <div className="h-screen bg-slate-50 overflow-hidden flex flex-col md:block">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />

      {/* Mobile Header */}
      <div className="md:hidden flex-none h-16 bg-slate-900 text-white flex items-center px-4 z-50 shadow-md">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="h-6 w-6" />
        </button>
        <span className="ml-4 font-bold text-lg">KursYönetim</span>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/95 z-40 pt-20 px-4 space-y-4">
          <button onClick={() => { setCurrentView('students'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-white p-3 rounded hover:bg-white/10">Öğrenciler</button>
          <button onClick={() => { setCurrentView('courses'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-white p-3 rounded hover:bg-white/10">Dersler</button>
          <button onClick={() => { setCurrentView('payments'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-white p-3 rounded hover:bg-white/10">Ödemeler</button>
          <button onClick={() => { setCurrentView('import-export'); setIsMobileMenuOpen(false); }} className="block w-full text-left text-white p-3 rounded hover:bg-white/10">Dışa/İçe Aktar</button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:h-full md:ml-64 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto pb-8">
          {currentView === 'students' && (
            <Students
              students={data.students}
              courses={data.courses}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              studentIdToOpen={studentIdToOpen}
              clearStudentIdToOpen={() => setStudentIdToOpen(null)}
            />
          )}
          {currentView === 'courses' && (
            <Courses
              courses={data.courses}
              students={data.students}
              onAddCourse={handleAddCourse}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
              onEnroll={handleEnrollStudent}
              onUnenroll={handleUnenrollStudent}
              onTransfer={handleTransferStudent}
              onViewStudent={handleViewStudentFromCourse}
            />
          )}
          {currentView === 'payments' && (
            <Payments
              payments={data.payments}
              students={data.students}
              courses={data.courses}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
            />
          )}
          {currentView === 'import-export' && (
            <ImportExport
              students={data.students}
              courses={data.courses}
              payments={data.payments}
              onBulkAddStudents={handleBulkAddStudents}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;