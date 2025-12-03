import React, { useState } from 'react';
import { Course, PeriodType, Student } from '../types';
import { Plus, Edit, Trash2, X, Calendar, DollarSign, Clock, Users, ArrowRight, ArrowRightLeft, UserMinus } from 'lucide-react';

interface CoursesProps {
  courses: Course[];
  students: Student[];
  onAddCourse: (c: Course) => void;
  onUpdateCourse: (c: Course) => void;
  onDeleteCourse: (id: string) => void;
  onEnroll: (studentId: string, courseId: string, date: string) => void;
  onUnenroll: (studentId: string, courseId: string) => void;
  onTransfer: (studentId: string, oldCourseId: string, newCourseId: string, date: string) => void;
  onViewStudent: (studentId: string) => void;
}

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export const Courses: React.FC<CoursesProps> = ({
  courses,
  students,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onEnroll,
  onUnenroll,
  onTransfer,
  onViewStudent
}) => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Transfer Modal State
  const [transferConfig, setTransferConfig] = useState<{ studentId: string, oldCourseId: string } | null>(null);
  const [transferTargetCourseId, setTransferTargetCourseId] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState<Partial<Course>>({});
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Enrollment State within Course Detail
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollDate, setEnrollDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.fee) return;

    const course: Course = {
      id: formData.id || crypto.randomUUID(),
      name: formData.name,
      startDate: formData.startDate,
      fee: Number(formData.fee),
      period: formData.period || 'monthly',
      scheduleDays: formData.scheduleDays || [],
      scheduleTime: formData.scheduleTime || '09:00',
      notes: formData.notes || ''
    };

    if (formData.id) {
      onUpdateCourse(course);
      if (selectedCourse?.id === course.id) setSelectedCourse(course);
    } else {
      onAddCourse(course);
    }
    setIsFormModalOpen(false);
    setFormData({});
  };

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourse && enrollStudentId) {
      onEnroll(enrollStudentId, selectedCourse.id, enrollDate);
      setEnrollStudentId(''); // Reset selection
      setEnrollDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferConfig && transferTargetCourseId) {
      onTransfer(transferConfig.studentId, transferConfig.oldCourseId, transferTargetCourseId, transferDate);
      setTransferConfig(null);
      setTransferTargetCourseId('');
    }
  };

  const handleDayToggle = (day: string) => {
    const currentDays = formData.scheduleDays || [];
    if (currentDays.includes(day)) {
      setFormData({ ...formData, scheduleDays: currentDays.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, scheduleDays: [...currentDays, day] });
    }
  };

  const getEnrolledStudents = (courseId: string) => {
    return students.filter(s => s.enrollments.some(e => e.courseId === courseId));
  };

  // Filter students NOT enrolled in the selected course for the dropdown
  const getAvailableStudents = (courseId: string) => {
    return students.filter(s => !s.enrollments.some(e => e.courseId === courseId));
  };

  const periodLabels: Record<PeriodType, string> = {
    weekly: 'Haftalık',
    monthly: 'Aylık',
    yearly: 'Yıllık'
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dersler</h2>
          <p className="text-slate-500">Müfredat ve ders programı yönetimi</p>
        </div>
        <button
          onClick={() => { setFormData({ period: 'monthly', scheduleDays: [] }); setIsFormModalOpen(true); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Yeni Ders</span>
        </button>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {courses.map(course => {
          const enrolledCount = getEnrolledStudents(course.id).length;
          return (
            <div
              key={course.id}
              onClick={() => { setSelectedCourse(course); setIsDetailModalOpen(true); }}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition cursor-pointer group"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition">{course.name}</h3>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded font-medium">
                    {periodLabels[course.period]}
                  </span>
                </div>

                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Başlangıç: {formatDate(course.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span>{course.fee} TL / {periodLabels[course.period]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    <span>{course.scheduleDays.join(', ')} @ {course.scheduleTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{enrolledCount} Öğrenci kayıtlı</span>
                  </div>
                </div>

                {course.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100">
                    <span className="font-bold">Not:</span> {course.notes}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setFormData(course); setIsFormModalOpen(true); }}
                  className="p-2 text-slate-600 hover:bg-white hover:text-primary rounded transition"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm('Bu dersi silmek istediğine emin misin?')) onDeleteCourse(course.id); }}
                  className="p-2 text-slate-600 hover:bg-white hover:text-danger rounded transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}

        {courses.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
            Henüz ders oluşturulmamış.
          </div>
        )}
      </div>

      {/* Weekly Schedule Preview */}
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4">Haftalık Program Özeti</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {DAYS.map(day => (
            <div key={day} className="bg-white border border-slate-200 rounded-lg p-3 min-h-[150px]">
              <div className="text-center font-bold text-slate-700 mb-2 border-b border-slate-100 pb-2 text-sm">{day}</div>
              <div className="space-y-2">
                {courses
                  .filter(c => c.scheduleDays.includes(day))
                  .sort((a, b) => a.scheduleTime.localeCompare(b.scheduleTime))
                  .map(c => (
                    <div key={c.id} className="text-xs bg-primary/10 text-primary p-2 rounded hover:bg-primary/20 cursor-pointer" onClick={() => { setSelectedCourse(c); setIsDetailModalOpen(true); }}>
                      <div className="font-bold">{c.scheduleTime}</div>
                      <div className="truncate">{c.name}</div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COURSE DETAIL MODAL */}
      {isDetailModalOpen && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedCourse.name}</h3>
                <div className="flex gap-3 text-sm text-slate-500 mt-1">
                  <span>{selectedCourse.scheduleDays.join(', ')} - {selectedCourse.scheduleTime}</span>
                  <span>•</span>
                  <span>{selectedCourse.fee} TL ({periodLabels[selectedCourse.period]})</span>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Enrolled Students List */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Kayıtlı Öğrenciler
                </h4>
                <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                  {getEnrolledStudents(selectedCourse.id).length > 0 ? (
                    <ul className="divide-y divide-slate-200">
                      {getEnrolledStudents(selectedCourse.id).map(student => (
                        <li
                          key={student.id}
                          className="p-3 flex justify-between items-center hover:bg-white transition group"
                        >
                          <div
                            className="flex items-center gap-3 cursor-pointer flex-1"
                            onClick={() => onViewStudent(student.id)}
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                              {student.firstName[0]}{student.lastName[0]}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{student.firstName} {student.lastName}</div>
                              <div className="text-xs text-slate-500">
                                Kayıt: {formatDate(student.enrollments.find(e => e.courseId === selectedCourse.id)?.joinDate || '')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setTransferConfig({ studentId: student.id, oldCourseId: selectedCourse.id })}
                              className="p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded"
                              title="Başka derse taşı"
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { if (confirm('Öğrenciyi bu dersten silmek istediğine emin misin?')) onUnenroll(student.id, selectedCourse.id); }}
                              className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded"
                              title="Dersten çıkar"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onViewStudent(student.id)}
                              className="p-2 text-slate-300 hover:text-slate-600"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-slate-500 text-sm">Bu derse kayıtlı öğrenci yok.</div>
                  )}
                </div>
              </div>

              {/* Enroll New Student */}
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <h4 className="font-bold text-slate-800 mb-3">Öğrenci Kaydet</h4>
                <form onSubmit={handleEnrollSubmit} className="flex flex-col md:flex-row gap-3">
                  <select
                    required
                    className="flex-1 border border-slate-300 rounded-lg p-2 text-sm bg-white text-slate-900"
                    value={enrollStudentId}
                    onChange={e => setEnrollStudentId(e.target.value)}
                  >
                    <option value="">Öğrenci Seçiniz</option>
                    {getAvailableStudents(selectedCourse.id).map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    required
                    className="w-full md:w-auto border border-slate-300 rounded-lg p-2 text-sm bg-white text-slate-900"
                    value={enrollDate}
                    onChange={e => setEnrollDate(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!enrollStudentId}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Kaydet
                  </button>
                </form>
                {getAvailableStudents(selectedCourse.id).length === 0 && (
                  <p className="text-xs text-slate-500 mt-2">Tüm öğrenciler bu derse kayıtlı.</p>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {transferConfig && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Öğrenciyi Taşı</h3>
            <p className="text-sm text-slate-500 mb-4">
              Öğrenci mevcut dersten çıkarılacak ve seçilen yeni derse kaydedilecek.
            </p>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Ders</label>
                <select
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white text-slate-900"
                  value={transferTargetCourseId}
                  onChange={e => setTransferTargetCourseId(e.target.value)}
                >
                  <option value="">Ders Seçiniz</option>
                  {courses.filter(c => c.id !== transferConfig.oldCourseId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Başlangıç Tarihi</label>
                <input
                  type="date"
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white text-slate-900"
                  value={transferDate}
                  onChange={e => setTransferDate(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferConfig(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={!transferTargetCourseId}
                  className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  Taşı
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT/CREATE COURSE FORM */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">
                {formData.id ? 'Ders Düzenle' : 'Yeni Ders Oluştur'}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ders Adı</label>
                <input
                  type="text"
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                    value={formData.startDate || ''}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ücret (TL)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                    value={formData.fee || ''}
                    onChange={e => setFormData({ ...formData, fee: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ödeme Periyodu</label>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                  value={formData.period}
                  onChange={e => setFormData({ ...formData, period: e.target.value as PeriodType })}
                >
                  <option value="weekly">Haftalık</option>
                  <option value="monthly">Aylık</option>
                  <option value="yearly">Yıllık</option>
                </select>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Ders Günleri & Saati</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1 rounded text-xs border ${formData.scheduleDays?.includes(day)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <input
                  type="time"
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                  value={formData.scheduleTime || '09:00'}
                  onChange={e => setFormData({ ...formData, scheduleTime: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notlar</label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg p-2 h-20 bg-white text-slate-900"
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white py-2">
                <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200">İptal</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};