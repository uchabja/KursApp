import React from 'react';
import { LayoutDashboard, Users, BookOpen, CreditCard, ArrowDownUp } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    // { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard }, // Merged into others for simplicity
    { id: 'students', label: 'Öğrenciler', icon: Users },
    { id: 'courses', label: 'Dersler', icon: BookOpen },
    { id: 'payments', label: 'Ödemeler', icon: CreditCard },
    { id: 'import-export', label: 'Dışa/İçe Aktar', icon: ArrowDownUp },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 hidden md:flex">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Kurs<span className="text-primary">Yönetim</span></h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-6 text-xs text-slate-500 border-t border-slate-800">
        &copy; 2024 Kurs Yönetim Sistemi
      </div>
    </div>
  );
};