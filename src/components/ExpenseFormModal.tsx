import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { X, Receipt } from 'lucide-react';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Partial<Expense>) => void;
  initialExpense?: Expense | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialExpense,
}) => {
  const [category, setCategory] = useState('نثريات الورشة');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(100);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = [
    'خامات ومستلزمات عامة',
    'كهرباء ومرافق',
    'صيانة ماكينات ومعدات',
    'نثريات الورشة',
    'إيجار ومخازن',
    'أجور وإعانات طارئة',
    'أخرى',
  ];

  useEffect(() => {
    if (initialExpense) {
      setCategory(initialExpense.category);
      setDescription(initialExpense.description);
      setAmount(initialExpense.amount);
      setDate(initialExpense.date);
    } else {
      setCategory('نثريات الورشة');
      setDescription('');
      setAmount(100);
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialExpense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialExpense ? initialExpense.id : `EXP-${Math.floor(100 + Math.random() * 900)}`,
      date,
      category,
      description,
      amount: Number(amount),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200">
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-400" />
            <h3 className="font-extrabold text-base">
              {initialExpense ? 'تعديل المصروف' : 'تسجيل مصروف جديد'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              نوع المصروف *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              بيان المصروف التفصيلي *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: فاتورة كهرباء، شراء إبر وقطع غيار..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                المبلغ (ج.م) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-rose-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                تاريخ المصروف *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm py-3 rounded-xl transition-all shadow-md shadow-rose-600/30"
            >
              تسجيل المصروف
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-3 rounded-xl transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
