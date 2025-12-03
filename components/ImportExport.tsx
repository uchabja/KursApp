import React, { useRef, useState } from 'react';
import { Student, Course, Payment } from '../types';
import * as XLSX from 'xlsx';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';

interface ImportExportProps {
  students: Student[];
  courses: Course[];
  payments: Payment[];
  onBulkAddStudents: (students: Student[]) => void;
}

export const ImportExport: React.FC<ImportExportProps> = ({ students, courses, payments, onBulkAddStudents }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // --- EXPORT LOGIC ---
  const handleExport = () => {
    try {
      // 1. Prepare Data
      const exportData = students.map(s => {
        // Get Enrollments Info
        const courseInfo = s.enrollments.map(e => {
            const course = courses.find(c => c.id === e.courseId);
            return course ? `${course.name} (Başlama: ${e.joinDate})` : '';
        }).filter(Boolean).join(', ');

        // Get Overdue Info
        const overduePayments = payments.filter(p => 
            p.studentId === s.id && 
            (p.status === 'overdue' || (p.status === 'pending' && new Date(p.dueDate) < new Date()))
        );
        const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);

        return {
          "Ad": s.firstName,
          "Soyad": s.lastName,
          "Telefon": s.phone,
          "Doğum Tarihi": s.dob,
          "Anne Adı": s.motherName || '',
          "Anne Telefon": s.motherPhone || '',
          "Baba Adı": s.fatherName || '',
          "Baba Telefon": s.fatherPhone || '',
          "Notlar": s.notes || '',
          "Kayıtlı Kurslar": courseInfo,
          "Toplam Gecikmiş Ödeme (TL)": totalOverdue > 0 ? totalOverdue : 0
        };
      });

      // 2. Create Sheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Öğrenciler");

      // 3. Download
      XLSX.writeFile(workbook, "KursYonetim_Ogrenciler.xlsx");
      setMessage({ type: 'success', text: "Excel dosyası başarıyla indirildi." });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: "Dışa aktarma sırasında bir hata oluştu." });
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Ad": "Ahmet",
        "Soyad": "Yılmaz",
        "Telefon": "05551234567",
        "Doğum Tarihi": "2010-05-20",
        "Anne Adı": "Ayşe Yılmaz",
        "Anne Telefon": "05559876543",
        "Baba Adı": "Mehmet Yılmaz",
        "Baba Telefon": "05551112233",
        "Notlar": "Gitar dersine ilgili"
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Şablon");
    XLSX.writeFile(workbook, "Ogrenci_Yukleme_Sablonu.xlsx");
  };

  // --- IMPORT LOGIC ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
           setMessage({ type: 'error', text: "Dosya boş veya uygun formatta değil." });
           return;
        }

        const newStudents: Student[] = [];

        // Map Excel columns to Student interface
        jsonData.forEach((row: any) => {
           if (row["Ad"] && row["Soyad"]) {
             newStudents.push({
               id: crypto.randomUUID(),
               firstName: row["Ad"],
               lastName: row["Soyad"],
               phone: row["Telefon"] ? String(row["Telefon"]) : '',
               dob: row["Doğum Tarihi"] || '', // Expecting ISO or trying to parse later if raw string
               motherName: row["Anne Adı"] || row["Anne"] || '',
               motherPhone: row["Anne Telefon"] ? String(row["Anne Telefon"]) : '',
               fatherName: row["Baba Adı"] || row["Baba"] || '',
               fatherPhone: row["Baba Telefon"] ? String(row["Baba Telefon"]) : '',
               notes: row["Notlar"] || '',
               enrollments: [] // New students have no enrollments initially
             });
           }
        });

        if (newStudents.length > 0) {
          onBulkAddStudents(newStudents);
          setMessage({ type: 'success', text: `${newStudents.length} öğrenci başarıyla içe aktarıldı.` });
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          setMessage({ type: 'error', text: "Dosyadan geçerli öğrenci verisi okunamadı. Lütfen şablonu kontrol edin." });
        }

      } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: "Dosya okunurken bir hata oluştu." });
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8">
       <div>
         <h2 className="text-2xl font-bold text-slate-800">Dışa ve İçe Aktar</h2>
         <p className="text-slate-500">Öğrenci verilerini Excel formatında yönetin.</p>
       </div>

       {message && (
         <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
           {message.type === 'success' ? <CheckCircle className="h-5 w-5"/> : <AlertCircle className="h-5 w-5"/>}
           {message.text}
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* EXPORT CARD */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center space-y-4">
             <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                <Download className="h-8 w-8" />
             </div>
             <h3 className="text-xl font-bold text-slate-800">Excel Olarak İndir</h3>
             <p className="text-slate-500 text-sm">
               Tüm öğrencilerinizi, veli bilgilerini, kayıtlı oldukları dersleri ve gecikmiş ödeme bilgilerini içeren kapsamlı bir Excel dosyası oluşturun.
             </p>
             <button 
               onClick={handleExport}
               className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium"
             >
               <FileSpreadsheet className="h-5 w-5" /> Listeyi İndir (.xlsx)
             </button>
          </div>

          {/* IMPORT CARD */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center space-y-4">
             <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                <Upload className="h-8 w-8" />
             </div>
             <h3 className="text-xl font-bold text-slate-800">Excel'den Yükle</h3>
             <p className="text-slate-500 text-sm">
               Toplu öğrenci kaydı yapmak için Excel dosyanızı yükleyin. Uygun format için önce şablonu indirmenizi öneririz.
             </p>
             
             <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-2 font-medium"
                >
                  <Upload className="h-5 w-5" /> Dosya Seç ve Yükle
                </button>
                <button 
                  onClick={handleDownloadTemplate}
                  className="text-primary hover:text-primary/80 text-sm font-medium hover:underline"
                >
                  Örnek Şablonu İndir
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};