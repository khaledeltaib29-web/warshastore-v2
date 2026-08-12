import React, { useState } from 'react';
import { Announcement, AppUser } from '../types';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Info,
  Calendar,
  UserCheck,
  X,
  Sparkles,
} from 'lucide-react';

interface AnnouncementsWidgetProps {
  announcements: Announcement[];
  currentUser: AppUser;
  onAddAnnouncement: (ann: Omit<Announcement, 'id' | 'createdAt'>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onEditAnnouncement: (ann: Announcement) => void;
}

export const AnnouncementsWidget: React.FC<AnnouncementsWidgetProps> = ({
  announcements,
  currentUser,
  onAddAnnouncement,
  onDeleteAnnouncement,
  onEditAnnouncement,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');

  const canManage = currentUser.role === 'super_admin' || currentUser.role === 'deputy_admin';

  const handleOpenNew = () => {
    setEditingAnn(null);
    setTitle('');
    setContent('');
    setPriority('normal');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setEditingAnn(ann);
    setTitle(ann.title);
    setContent(ann.content);
    setPriority(ann.priority);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (editingAnn) {
      onEditAnnouncement({
        ...editingAnn,
        title: title.trim(),
        content: content.trim(),
        priority,
      });
    } else {
      onAddAnnouncement({
        title: title.trim(),
        content: content.trim(),
        authorName: currentUser.name,
        priority,
      });
    }

    setIsFormOpen(false);
    setTitle('');
    setContent('');
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-xs">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              لوحة الإعلانات والتعليمات المركزية
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {announcements.length} إعلانات
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              التعميمات والتنبيهات الموجهة لجميع الورش والمستويات الإدارية
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            إعلان جديد
          </button>
        )}
      </div>

      {/* Announcements Modal Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 text-xs animate-fadeIn shadow-lg border border-slate-800"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-black text-amber-400 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {editingAnn ? 'تعديل الإعلان' : 'إنشاء إعلان عام جديد'}
            </h4>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">عنوان الإعلان</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان واضح وموجز..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">نص التعميم / الإعلان</label>
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب التوجيهات أو التعليمات بالتفصيل..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-slate-300 font-bold">أهمية الإعلان:</label>
              <label className="flex items-center gap-1.5 text-slate-200 cursor-pointer font-bold">
                <input
                  type="radio"
                  name="priority"
                  value="normal"
                  checked={priority === 'normal'}
                  onChange={() => setPriority('normal')}
                  className="accent-amber-400"
                />
                عادي
              </label>
              <label className="flex items-center gap-1.5 text-rose-400 cursor-pointer font-bold">
                <input
                  type="radio"
                  name="priority"
                  value="urgent"
                  checked={priority === 'urgent'}
                  onChange={() => setPriority('urgent')}
                  className="accent-rose-500"
                />
                عاجل ومهم 🚨
              </label>
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-all shadow-xs"
            >
              {editingAnn ? 'تحديث الإعلان' : 'نشر الإعلان فوراً'}
            </button>
          </div>
        </form>
      )}

      {/* Announcements Feed */}
      <div className="space-y-2.5">
        {announcements.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
            <Info className="w-6 h-6 mx-auto opacity-40 text-amber-600" />
            <p className="text-xs font-bold">لا توجد إعلانات عامة حالياً</p>
          </div>
        ) : (
          announcements.map((ann, idx) => (
            <div
              key={`${ann.id}-${idx}`}
              className={`p-3.5 rounded-2xl border transition-all ${
                ann.priority === 'urgent'
                  ? 'bg-rose-50/90 border-rose-200 shadow-2xs'
                  : 'bg-amber-50/50 border-amber-200/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      ann.priority === 'urgent'
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {ann.priority === 'urgent' ? (
                      <AlertTriangle className="w-4 h-4 animate-bounce" />
                    ) : (
                      <Megaphone className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-black text-slate-900">{ann.title}</h4>
                      {ann.priority === 'urgent' && (
                        <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          تنبيه هام وعاجل
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 font-semibold leading-relaxed whitespace-pre-line">
                      {ann.content}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold pt-1">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        الناشر: {ann.authorName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {ann.createdAt}
                      </span>
                    </div>
                  </div>
                </div>

                {canManage && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(ann)}
                      title="تعديل الإعلان"
                      className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-100/60 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteAnnouncement(ann.id)}
                      title="حذف الإعلان"
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-100/60 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
