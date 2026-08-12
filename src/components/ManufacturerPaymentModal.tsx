import React, { useState, useEffect } from 'react';
import { Manufacturer } from '../types';
import { formatCurrency } from '../utils/calculations';
import { X, CreditCard, DollarSign } from 'lucide-react';

interface ManufacturerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePayment: (manufacturerName: string, amount: number, notes: string) => void;
  manufacturers: Manufacturer[];
  defaultManufacturerName?: string;
}

export const ManufacturerPaymentModal: React.FC<ManufacturerPaymentModalProps> = ({
  isOpen,
  onClose,
  onSavePayment,
  manufacturers,
  defaultManufacturerName,
}) => {
  const [selectedName, setSelectedName] = useState('');
  const [amount, setAmount] = useState(500);
  const [notes, setNotes] = useState('دفعة أجر مصنعية تحت الحساب');

  useEffect(() => {
    if (defaultManufacturerName) {
      setSelectedName(defaultManufacturerName);
    } else if (manufacturers.length > 0) {
      setSelectedName(manufacturers[0].name);
    }
    setAmount(500);
    setNotes('دفعة أجر مصنعية تحت الحساب');
  }, [defaultManufacturerName, isOpen, manufacturers]);

  const selectedManufacturer = manufacturers.find((m) => m.name === selectedName);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedName) return;
    onSavePayment(selectedName, Number(amount), notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200">
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base">تسديد دفعة مالية للمصنعة</h3>
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
              اسم المصنعة / الورشة *
            </label>
            <select
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
            >
              {manufacturers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} (متبقي لها: {m.remainingBalance}ج)
                </option>
              ))}
            </select>
          </div>

          {selectedManufacturer && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">إجمالي مستحقات الورشة:</span>
                <strong className="text-slate-800 font-bold">
                  {formatCurrency(selectedManufacturer.totalWorkmanshipEarned)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المدفوع لها سابقاً:</span>
                <strong className="text-emerald-700 font-bold">
                  {formatCurrency(selectedManufacturer.paidAmount)}
                </strong>
              </div>
              <div className="flex justify-between text-amber-900 font-extrabold pt-1 border-t border-slate-200">
                <span>المتبقي قبل هذه الدفعة:</span>
                <span>{formatCurrency(selectedManufacturer.remainingBalance)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              مبلغ الدفعة الجديدة (ج.م) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-purple-700"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ملاحظات / البيان
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-purple-700 hover:bg-purple-600 text-white font-black text-sm py-3 rounded-xl transition-all shadow-md shadow-purple-700/30"
            >
              خصم وتخصيص الدفعة
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
