import React, { useState } from 'react';
import { Expense } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Receipt, Plus, Search, Calendar, Tag, Trash2, Edit2 } from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  onOpenNewExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onOpenNewExpense,
  onEditExpense,
  onDeleteExpense,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filtered = expenses.filter(
    (e) =>
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.date.includes(searchQuery)
  );

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-rose-600" />
            سجل المصروفات والنثريات ({expenses.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تسجيل مصروفات التشغيل والكهرباء والصيانة والخامات العامة لحساب صافي الربح بدقة.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-rose-50 border border-rose-200/80 px-3.5 py-2 rounded-xl text-right">
            <span className="text-[11px] text-rose-700 font-bold block">إجمالي المصروفات</span>
            <strong className="text-base font-black text-rose-800">
              {formatCurrency(totalExpensesAmount)}
            </strong>
          </div>

          <button
            onClick={onOpenNewExpense}
            className="flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-3 sm:py-2.5 rounded-xl transition-all shadow-md shadow-rose-600/20"
          >
            <Plus className="w-4 h-4" />
            تسجيل مصروف
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث بنوع المصروف، البيان، أو التاريخ..."
          className="w-full pr-11 pl-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
        />
      </div>

      {/* Expenses List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-bold text-base">لا توجد مصروفات مسجلة</p>
          <p className="text-slate-400 text-xs mt-1">اضغط على "تسجيل مصروف" لإدخال أول فواتير أو نثريات للورشة.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((exp, idx) => (
              <div
                key={`${exp.id}-${idx}`}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {exp.category}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {exp.date}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{exp.description}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-2 sm:pt-0 border-slate-100">
                  <span className="text-lg font-black text-rose-700">
                    {formatCurrency(exp.amount)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditExpense(exp)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-slate-100 transition-colors"
                      title="تعديل"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-slate-100 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
