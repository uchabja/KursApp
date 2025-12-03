import React, { useState, useMemo, useEffect } from 'react';
import { Student, Course } from '../types';
import { Plus, Search, Trash2, Edit, BookOpen, X, Phone, User, FileText, ArrowUp, ArrowDown, Filter } from 'lucide-react';

interface StudentsProps {
  students: Student[];
  courses: Course[];
  onAddStudent: (s: Student) => void;
  onUpdateStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
  studentIdToOpen?: string | null;
  clearStudentIdToOpen?: () => void;
}

type SortKey = 'name' | 'status' | 'age';
type SortDirection = 'asc' | 'desc';

export const Students: React.FC<StudentsProps> = ({
  students,
  courses,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  studentIdToOpen,
  clearStudentIdToOpen
}) => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'name', direction: 'asc' });

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [noPhone, setNoPhone] = useState(false);

  // Effect to open student detail if requested by parent (e.g. from Courses)
  useEffect(() => {
    if (studentIdToOpen) {
      const s = students.find(st => st.id === studentIdToOpen);
      if (s) {
        setSelectedStudent(s);
        setIsDetailModalOpen(true);
      }
      if (clearStudentIdToOpen) clearStudentIdToOpen();
    }
  }, [studentIdToOpen, students, clearStudentIdToOpen]);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredStudents = useMemo(() => {
    let result = students.filter(s => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = s.firstName.toLowerCase().includes(term) || s.lastName.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesCourse = courseFilter === 'all' || s.enrollments.some(e => e.courseId === courseFilter);

      return matchesSearch && matchesStatus && matchesCourse;
    });

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortConfig.key === 'name') {
        comparison = a.firstName.localeCompare(b.firstName);
      } else if (sortConfig.key === 'status') {
        comparison = (a.status || '').localeCompare(b.status || '');
      } else if (sortConfig.key === 'age') {
        comparison = calculateAge(a.dob) - calculateAge(b.dob);
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [students, searchTerm, statusFilter, courseFilter, sortConfig]);

  const handleOpenForm = (student?: Student) => {
    if (student) {
      setFormData({
        ...student,
        dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : ''
      });
      setNoPhone(!student.phone);
    } else {
      setFormData({});
      setNoPhone(false);
    }
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Bu öğrenciyi silmek istediğinize emin misiniz? Tüm ödemeleri ve kayıtları silinecektir.')) {
      onDeleteStudent(id);
    }
  };

  const handlePhoneChange = (field: 'phone' | 'motherPhone' | 'fatherPhone', value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, [field]: numericValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.dob) return;

    const student: Student = {
      id: formData.id || crypto.randomUUID(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: noPhone ? '' : (formData.phone || ''),
      dob: formData.dob,
      motherName: formData.motherName,
      motherPhone: formData.motherPhone,
      fatherName: formData.fatherName,
      fatherPhone: formData.fatherPhone,
      notes: formData.notes,
      status: formData.status || 'active',
      enrollments: formData.enrollments || []
    };

    if (formData.id) {
      onUpdateStudent(student);
      if (selectedStudent?.id === student.id) setSelectedStudent(student); // Update detail view if open
    } else {
      onAddStudent(student);
    }
    setIsFormModalOpen(false);
    setFormData({});
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <div className="w-4 h-4" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Öğrenciler</h2>
          <p className="text-slate-500">Toplam {students.length} kayıtlı öğrenci</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Öğrenci ara..."
              className="w-full md:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Yeni Öğrenci</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtrele:</span>
        </div>
        <select
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
          <option value="prereg">Ön Kayıt</option>
        </select>
        <select
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="all">Tüm Dersler</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.name}</option>
          ))}
        </select>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th
                className="px-6 py-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">İsim <SortIcon columnKey="name" /></div>
              </th>
              <th
                className="px-6 py-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition select-none"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">Durum <SortIcon columnKey="status" /></div>
              </th>
              <th
                className="px-6 py-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition select-none"
                onClick={() => handleSort('age')}
              >
                <div className="flex items-center gap-2">Yaş <SortIcon columnKey="age" /></div>
              </th>
              <th className="px-6 py-4 font-semibold text-slate-700">İletişim</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Dersler</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map(student => (
              <tr
                key={student.id}
                onClick={() => { setSelectedStudent(student); setIsDetailModalOpen(true); }}
                className="cursor-pointer hover:bg-slate-50 transition"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{student.firstName} {student.lastName}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.status === 'active' ? 'bg-green-100 text-green-700' :
                    student.status === 'passive' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                    {student.status === 'active' ? 'Aktif' : student.status === 'passive' ? 'Pasif' : 'Ön Kayıt'}
                  </span>
                </td>
                <td className="px-6 py-4">{calculateAge(student.dob)}</td>
                <td className="px-6 py-4">
                  {student.phone ? (
                    <div>{student.phone}</div>
                  ) : (
                    <span className="text-slate-400 italic">Yok</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {student.enrollments.map((en, idx) => {
                      const course = courses.find(c => c.id === en.courseId);
                      return (
                        <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                          {course?.name || 'Silinmiş Ders'}
                        </span>
                      )
                    })}
                    {student.enrollments.length === 0 && <span className="text-slate-400 text-xs">-</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenForm(student); }}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, student.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredStudents.length === 0 && (
          <div className="p-8 text-center text-slate-500">Öğrenci bulunamadı.</div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedStudent.status === 'active' ? 'bg-green-100 text-green-700' :
                      selectedStudent.status === 'passive' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                      {selectedStudent.status === 'active' ? 'Aktif' : selectedStudent.status === 'passive' ? 'Pasif' : 'Ön Kayıt'}
                    </span>
                    <p className="text-slate-500 text-sm">Doğum: {formatDate(selectedStudent.dob)} ({calculateAge(selectedStudent.dob)} Yaş)</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-500 mb-2">Öğrenci İletişim</h4>
                  {selectedStudent.phone ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{selectedStudent.phone}</span>
                      <a href={`tel:${selectedStudent.phone}`} className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200">
                        <Phone className="h-3 w-3" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-sm">Telefon Yok</span>
                  )}
                </div>

                {(selectedStudent.motherName || selectedStudent.fatherName) ? (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                    {selectedStudent.motherName && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 mb-1">Anne</h4>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{selectedStudent.motherName}</span>
                          {selectedStudent.motherPhone && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600">{selectedStudent.motherPhone}</span>
                              <a href={`tel:${selectedStudent.motherPhone}`} className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200">
                                <Phone className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {selectedStudent.motherName && selectedStudent.fatherName && <div className="border-t border-slate-200"></div>}
                    {selectedStudent.fatherName && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 mb-1">Baba</h4>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{selectedStudent.fatherName}</span>
                          {selectedStudent.fatherPhone && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600">{selectedStudent.fatherPhone}</span>
                              <a href={`tel:${selectedStudent.fatherPhone}`} className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200">
                                <Phone className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 text-sm italic">
                    Veli bilgisi girilmemiş
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <h4 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Notlar
                </h4>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {selectedStudent.notes || "Bu öğrenci için not girilmemiş."}
                </p>
              </div>

              {/* Enrollments */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Kayıtlı Dersler
                </h4>
                {selectedStudent.enrollments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedStudent.enrollments.map((en, idx) => {
                      const course = courses.find(c => c.id === en.courseId);
                      return (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                          <div>
                            <div className="font-bold text-slate-800">{course?.name}</div>
                            <div className="text-xs text-slate-500">Kayıt: {formatDate(en.joinDate)}</div>
                          </div>
                          <div className="text-xs bg-slate-100 px-2 py-1 rounded">
                            {course?.period === 'weekly' ? 'Haftalık' : course?.period === 'monthly' ? 'Aylık' : 'Yıllık'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Henüz bir derse kayıtlı değil. Ders kaydı için Dersler ekranını kullanın.</p>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => { setIsDetailModalOpen(false); handleOpenForm(selectedStudent); }}
                className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Düzenle
              </button>
              <button onClick={() => setIsDetailModalOpen(false)} className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT/CREATE FORM MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">
                {formData.id ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">İsim</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                    value={formData.firstName || ''}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Soyisim</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                    value={formData.lastName || ''}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Doğum Tarihi</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                    value={formData.dob || ''}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="tel"
                      disabled={noPhone}
                      className={`w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 ${noPhone ? 'opacity-50 cursor-not-allowed' : ''}`}
                      value={noPhone ? '' : (formData.phone || '')}
                      onChange={e => handlePhoneChange('phone', e.target.value)}
                      placeholder="5551234567"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noPhone}
                      onChange={(e) => setNoPhone(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Telefon Yok
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-500 mb-3">Veli Bilgileri (Opsiyonel)</p>

                {/* Mother */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Anne İsim</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                      value={formData.motherName || ''}
                      onChange={e => setFormData({ ...formData, motherName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Anne Telefon</label>
                    <input
                      type="tel"
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                      value={formData.motherPhone || ''}
                      onChange={e => handlePhoneChange('motherPhone', e.target.value)}
                      placeholder="5551234567"
                    />
                  </div>
                </div>

                {/* Father */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Baba İsim</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                      value={formData.fatherName || ''}
                      onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Baba Telefon</label>
                    <input
                      type="tel"
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                      value={formData.fatherPhone || ''}
                      onChange={e => handlePhoneChange('fatherPhone', e.target.value)}
                      placeholder="5551234567"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Durum</label>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                  value={formData.status || 'active'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="active">Aktif</option>
                  <option value="passive">Pasif</option>
                  <option value="prereg">Ön Kayıt</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Öğrenci Notu</label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg p-2 h-20 bg-white text-slate-900"
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Öğrenci hakkında özel notlar..."
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