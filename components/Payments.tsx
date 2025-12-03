import React, { useState, useMemo } from 'react';
import { Payment, Student, Course, PaymentStatus } from '../types';
import { Search, CheckCircle, Clock, AlertCircle, XCircle, Filter } from 'lucide-react';

interface PaymentsProps {
  payments: Payment[];
  students: Student[];
  courses: Course[];
  onUpdatePaymentStatus: (paymentId: string, status: PaymentStatus) => void;
}

export const Payments: React.FC<PaymentsProps> = ({
  payments,
  students,
  courses,
  onUpdatePaymentStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');

  // Date Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [useDateFilter, setUseDateFilter] = useState(false); // If false, default "Smart" view

  const filteredPayments = useMemo(() => {
    // Determine the cut-off date for the "default" view (Smart view)
    // Show everything up to the end of the current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    return payments.filter(p => {
      // 1. Search Filter
      const student = students.find(s => s.id === p.studentId);
      const matchesSearch = student
        ? `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        : false;
      if (!matchesSearch) return false;

      // 2. Status Filter
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      // 3. Date Logic
      const dueDate = new Date(p.dueDate);

      if (useDateFilter) {
        // Strict Month/Year filtering
        return dueDate.getFullYear() === selectedYear && dueDate.getMonth() === selectedMonth;
      } else {
        // Default View: Show Overdue OR (Pending/Paid belonging to Past or Current Month)
        // Basically anything where due date <= end of current month
        // Also ensure we don't just hide unpaid old debts. Overdue status handles that visually, but we need the record.
        return dueDate <= endOfCurrentMonth;
      }
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [payments, students, searchTerm, statusFilter, selectedYear, selectedMonth, useDateFilter]);

  // Statistics calculation based on *visible* data or *total* data? 
  // Usually Dashboard stats should reflect the "Current State" (Total Overdue in system, Total Collected this month?)
  // Let's make stats reflect the *Filtered View* to avoid confusion.
  const totalCollected = filteredPayments.filter(p => p.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = filteredPayments.filter(p => p.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);

  // For overdue, we check if date is past AND status is pending
  const totalOverdue = filteredPayments.filter(p =>
    p.status === 'overdue' || (p.status === 'pending' && new Date(p.dueDate) < new Date())
  ).reduce((acc, curr) => acc + curr.amount, 0);

  const getDisplayStatus = (p: Payment): PaymentStatus => {
    if (p.status === 'pending' && new Date(p.dueDate) < new Date()) return 'overdue';
    return p.status;
  };

  const statusColors: Record<PaymentStatus, string> = {
    paid: 'bg-green-100 text-green-700 border-green-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    overdue: 'bg-red-100 text-red-700 border-red-200',
    waived: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const statusLabels: Record<PaymentStatus, string> = {
    paid: 'Ödendi',
    pending: 'Bekliyor',
    overdue: 'Gecikmiş',
    waived: 'Pas'
  };

  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Görüntülenen Tahsilat</p>
              <h3 className="text-2xl font-bold text-slate-800">{totalCollected.toLocaleString('tr-TR')} TL</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Görüntülenen Bekleyen</p>
              <h3 className="text-2xl font-bold text-slate-800">{totalPending.toLocaleString('tr-TR')} TL</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-lg text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Görüntülenen Gecikmiş</p>
              <h3 className="text-2xl font-bold text-slate-800">{totalOverdue.toLocaleString('tr-TR')} TL</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800">Ödeme Hareketleri</h2>

          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
            {/* Date Filters */}
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setUseDateFilter(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded ${!useDateFilter ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Güncel Durum
              </button>
              <button
                onClick={() => setUseDateFilter(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded ${useDateFilter ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Geçmiş/Tarih
              </button>
            </div>

            {useDateFilter && (
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}

            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

            {/* Search & Status */}
            <div className="relative flex-1 md:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Öğrenci ara..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white text-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Bekleyen</option>
              <option value="overdue">Gecikmiş</option>
              <option value="paid">Ödenen</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Öğrenci</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Ders</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Dönem</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Tutar</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Son Ödeme</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Ödeme Tarihi</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Durum</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map(payment => {
                const student = students.find(s => s.id === payment.studentId);
                const course = courses.find(c => c.id === payment.courseId);
                const displayStatus = getDisplayStatus(payment);

                return (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">{student?.firstName} {student?.lastName}</td>
                    <td className="px-6 py-4 text-slate-600">{course?.name}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(payment.periodStart).toLocaleDateString('tr-TR')} - {new Date(payment.periodEnd).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{payment.amount} TL</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(payment.dueDate).toLocaleDateString('tr-TR')}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[displayStatus]}`}>
                        {statusLabels[displayStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.status !== 'paid' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onUpdatePaymentStatus(payment.id, 'paid')}
                            className="bg-green-100 text-green-700 p-1.5 rounded hover:bg-green-200"
                            title="Ödendi İşaretle"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onUpdatePaymentStatus(payment.id, 'waived')}
                            className="bg-slate-100 text-slate-700 p-1.5 rounded hover:bg-slate-200"
                            title="Pas Geç (Borç Sil)"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {payment.status === 'paid' && (
                        <span className="text-xs text-slate-400">Tamamlandı</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredPayments.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              {useDateFilter
                ? "Seçilen tarihte ödeme kaydı bulunamadı."
                : "Görüntülenecek güncel veya gecikmiş ödeme yok."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
