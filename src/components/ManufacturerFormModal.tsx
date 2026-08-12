import React, { useState, useEffect } from 'react';
import { Manufacturer, Product } from '../types';
import { X, Users, MapPin, Phone, Hash, DollarSign, Package } from 'lucide-react';

interface ManufacturerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (manufacturer: Partial<Manufacturer>) => void;
  initialManufacturer: Manufacturer | null;
  existingProducts?: Product[];
}

export const ManufacturerFormModal: React.FC<ManufacturerFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialManufacturer,
  existingProducts = [],
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [productsList, setProductsList] = useState('');
  const [payMethod, setPayMethod] = useState<'percentage' | 'fixed' | 'manual'>('percentage');
  const [payValue, setPayValue] = useState<number>(60);
  const [totalWorkmanshipEarned, setTotalWorkmanshipEarned] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  useEffect(() => {
    if (initialManufacturer) {
      setCode(initialManufacturer.code || `MF00${Math.floor(Math.random() * 90 + 10)}`);
      setName(initialManufacturer.name || '');
      setPhone(initialManufacturer.phone || '');
      setAddress(initialManufacturer.address || '');
      setProductsList(initialManufacturer.productsList || '');
      setPayMethod(initialManufacturer.payMethod || 'percentage');
      setPayValue(initialManufacturer.payValue !== undefined ? initialManufacturer.payValue : 60);
      setTotalWorkmanshipEarned(initialManufacturer.totalWorkmanshipEarned || 0);
      setPaidAmount(initialManufacturer.paidAmount || 0);
    } else {
      setCode(`MF00${Math.floor(Math.random() * 80 + 10)}`);
      setName('');
      setPhone('');
      setAddress('');
      setProductsList('');
      setPayMethod('percentage');
      setPayValue(60);
      setTotalWorkmanshipEarned(0);
      setPaidAmount(0);
    }
  }, [initialManufacturer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('يرجى كتابة اسم المصنعة أو الورشة');
      return;
    }

    const remainingBalance = Math.max(0, Number(totalWorkmanshipEarned) - Number(paidAmount));

    const savedData: Partial<Manufacturer> = {
      id: initialManufacturer?.id || `MNF-${Date.now()}`,
      code: code.trim() || `MF00${Math.floor(Math.random() * 90 + 10)}`,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      productsList: productsList.trim(),
      completedUnits: initialManufacturer?.completedUnits || 0,
      payMethod,
      payValue: Number(payValue) || 0,
      totalWorkmanshipEarned: Number(totalWorkmanshipEarned),
      paidAmount: Number(paidAmount),
      remainingBalance,
    };

    onSave(savedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base">
              {initialManufacturer ? 'تعديل بيانات المصنعة / الورشة' : 'تسجيل مصنعة / ورشة جديدة'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Row 1: Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-purple-600" />
                كود المصنعة
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: MF001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black text-purple-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                اسم المصنعة / الورشة *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أم أحمد (ورشة الخياطة)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Row 2: Phone & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                رقم الهاتف *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010xxxxxxx"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 dir-ltr text-right"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                المنطقة / العنوان
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: المحلة الكبرى - شارع البحر"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Row 3: Products List */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-amber-600" />
              المنتجات المسندة للورشة
            </label>
            <input
              type="text"
              value={productsList}
              onChange={(e) => setProductsList(e.target.value)}
              placeholder="عباية كريب مطرزة، فستان سواريه ستان..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
            />
            {existingProducts.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="text-[10px] text-slate-400 font-semibold block w-full mb-0.5">
                  أضف سريعا من الكتالوج:
                </span>
                {existingProducts.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (!productsList.includes(p.name)) {
                        setProductsList(
                          productsList ? `${productsList}, ${p.name}` : p.name
                        );
                      }
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-semibold"
                  >
                    + {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Financial System for Manufacturers (3 Models) */}
          <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-purple-950 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-purple-600" />
              النظام المالي وحساب مستحقات الورشة
            </h4>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                طريقة المحاسبة وحساب المستحقات *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPayMethod('percentage');
                    if (payValue === 0) setPayValue(60);
                  }}
                  className={`p-2 rounded-xl text-xs font-black border text-center transition-all ${
                    payMethod === 'percentage'
                      ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  أ) نسبة مئوية (%)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPayMethod('fixed');
                    if (payValue === 0) setPayValue(50);
                  }}
                  className={`p-2 rounded-xl text-xs font-black border text-center transition-all ${
                    payMethod === 'fixed'
                      ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  ب) دخل ثابت (ج.م)
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('manual')}
                  className={`p-2 rounded-xl text-xs font-black border text-center transition-all ${
                    payMethod === 'manual'
                      ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  ج) إدخال يدوي مباشر
                </button>
              </div>
            </div>

            {payMethod === 'percentage' && (
              <div>
                <label className="text-[11px] font-bold text-purple-900 block mb-1">
                  النسبة المئوية المخصصة للورشة من المبيعات (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={payValue}
                    onChange={(e) => setPayValue(Number(e.target.value))}
                    className="w-28 px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs font-black text-purple-950"
                  />
                  <span className="text-xs text-purple-700 font-bold">% من قيمة الأوردرات والقطع المنفذة</span>
                </div>
              </div>
            )}

            {payMethod === 'fixed' && (
              <div>
                <label className="text-[11px] font-bold text-purple-900 block mb-1">
                  المبلغ/الدخل الثابت المتفق عليه (ج.م للقطعة)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={payValue}
                    onChange={(e) => setPayValue(Number(e.target.value))}
                    className="w-28 px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs font-black text-purple-950"
                  />
                  <span className="text-xs text-purple-700 font-bold">ج.م عن كل قطعة منفذة ومسلمة</span>
                </div>
              </div>
            )}

            {payMethod === 'manual' && (
              <p className="text-[11px] text-purple-800 font-semibold bg-purple-100/70 p-2 rounded-xl">
                💡 في نظام الإدخال اليدوي، يتم تحديد إجمالي المستحقات والمديونيات مباشرة وبشكل يدوي كاملاً.
              </p>
            )}
          </div>

          {/* Financial Dues Opening Balances */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-amber-900 flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-amber-600" />
              أرصدة البداية والمستحقات المبدئية
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  إجمالي المصنعية المستحقة (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalWorkmanshipEarned}
                  onChange={(e) => setTotalWorkmanshipEarned(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  المدفوع لها سابقاً (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-emerald-700"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-200/80">
              <span className="font-bold text-slate-600">المتبقي للمعلق المبدئي:</span>
              <strong className="text-amber-900 font-extrabold text-sm">
                {Math.max(0, totalWorkmanshipEarned - paidAmount)} ج.م
              </strong>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-sm py-3 rounded-xl transition-all shadow-md"
            >
              حفظ بيانات المصنعة
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
