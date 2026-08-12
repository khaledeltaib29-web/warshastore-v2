import React, { useState, useEffect } from 'react';
import { Product, Manufacturer } from '../types';
import { formatCurrency } from '../utils/calculations';
import { X, PackageCheck, Sparkles, Tag, Users, Scale, Palette, DollarSign, Boxes, MapPin } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => void;
  initialProduct?: Product | null;
  manufacturers: Manufacturer[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct,
  manufacturers,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [weightGrams, setWeightGrams] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [manufacturerPay, setManufacturerPay] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(1);
  const [manufacturerName, setManufacturerName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'متاح' | 'مباع' | 'محجوز'>('متاح');

  useEffect(() => {
    if (initialProduct) {
      setCode(initialProduct.id);
      setName(initialProduct.name);
      setColor(initialProduct.color || '');
      setWeightGrams(initialProduct.rawMaterialWeightKg ? Math.round(initialProduct.rawMaterialWeightKg * 1000) : '');
      setSalePrice(initialProduct.salePrice);
      setManufacturerPay(initialProduct.workmanshipCost);
      setStock(initialProduct.stock);
      setManufacturerName(initialProduct.manufacturerName);
      setImageUrl(initialProduct.imageUrl || '');
      setStatus(initialProduct.status || (initialProduct.stock > 0 ? 'متاح' : 'مباع'));
    } else {
      setCode('');
      setName('شنطة');
      setColor('');
      setWeightGrams('');
      setSalePrice('');
      setManufacturerPay(0);
      setStock(1);
      setImageUrl('');
      setStatus('متاح');
      if (manufacturers.length > 0) {
        setManufacturerName(manufacturers[0].name);
      }
    }
  }, [initialProduct, isOpen, manufacturers]);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 500;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
              setImageUrl(compressedDataUrl);
            } else {
              setImageUrl(reader.result.toString().substring(0, 32000));
            }
          };
          img.onerror = () => {
            setImageUrl(reader.result ? reader.result.toString().substring(0, 32000) : '');
          };
          img.src = reader.result.toString();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMfg = manufacturers.find((m) => m.name === manufacturerName);
    const weightKg = weightGrams ? Number(weightGrams) / 1000 : 0;
    const pay = Number(manufacturerPay) || 0;
    const price = Number(salePrice) || 0;

    onSave({
      id: code.trim() || (initialProduct ? initialProduct.id : `PRD-${Math.floor(1000 + Math.random() * 9000)}`),
      name: name.trim() || 'شنطة',
      salePrice: price,
      rawMaterialWeightKg: weightKg,
      rawMaterialPricePerKg: 0,
      rawMaterialCost: 0,
      workmanshipCost: pay,
      totalCost: pay,
      unitProfit: price - pay,
      stock: Number(stock) || 0,
      manufacturerName,
      color: color.trim(),
      governorate: selectedMfg?.address || '',
      manufacturerCode: selectedMfg?.code || '',
      imageUrl: imageUrl.trim(),
      status: status || (Number(stock) > 0 ? 'متاح' : 'مباع'),
    });
    onClose();
  };

  const calculatedProfit = (Number(salePrice) || 0) - (Number(manufacturerPay) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-400 text-slate-950 p-2 rounded-xl font-black">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {initialProduct ? 'تعديل بيانات قطعة ومصنعتها' : 'إضافة قطعة جديدة للمخزون'}
              </h3>
              <p className="text-xs text-slate-400">إدخال كود القطعة، البيانات، مستحق المصنعة، وسعر البيع</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Code */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                كود القطعة (مثال: A001, S010) *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="مثال: A001"
                className="w-full px-3.5 py-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-sm font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                اسم المنتج والموديل *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: شنطة"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Manufacturer Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              المصنعة اليدوية المسؤولّة *
            </label>
            <select
              value={manufacturerName}
              onChange={(e) => setManufacturerName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {manufacturers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} {m.code ? `(${m.code})` : ''} - {m.address || 'غير محدد'}
                </option>
              ))}
            </select>
          </div>

          {/* Color & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-purple-600" />
                اللون
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="مثال: فوشيا / أزرق"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                الوزن (بالجرام جم)
              </label>
              <input
                type="number"
                min="0"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="مثال: 626"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Financials: Sale Price & Manufacturer Pay */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                سعر البيع (ج.م) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="350"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-purple-900 block mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                مستحق المصنعة بالمخزون (0 ج.م افتراضياً)
              </label>
              <input
                type="number"
                min="0"
                value={manufacturerPay}
                onChange={(e) => setManufacturerPay(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0 (يُحسب عند أوردر البيع)"
                className="w-full px-3.5 py-2.5 bg-purple-50 border border-purple-300 rounded-xl text-sm font-extrabold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[10px] text-slate-500 font-medium mt-1 leading-snug">
                💡 تكون 0 ج.م بالمخزون العام، وتُحسب تلقائياً أثناء أوردر البيع والتسليم.
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-[10px] text-purple-700 font-bold">تحديد سريع:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (salePrice) {
                      setManufacturerPay(Math.round(Number(salePrice) * 0.60));
                    }
                  }}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors"
                  title="تحديد مستحق المصنعة بـ 60% من سعر البيع"
                >
                  60%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (salePrice) {
                      setManufacturerPay(Math.round(Number(salePrice) * 0.50));
                    }
                  }}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors"
                  title="تحديد مستحق المصنعة بـ 50% من سعر البيع"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (salePrice) {
                      setManufacturerPay(Math.round(Number(salePrice) * 0.40));
                    }
                  }}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors"
                  title="تحديد مستحق المصنعة بـ 40% من سعر البيع"
                >
                  40%
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5 text-amber-600" />
                الكمية بالمخزون *
              </label>
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setStock(val);
                  if (val === 0) {
                    setStatus('مباع');
                  } else if (status === 'مباع' && typeof val === 'number' && val > 0) {
                    setStatus('متاح');
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Product Status Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              حالة المنتج
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('متاح')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all border ${
                  status === 'متاح'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🟢 متاح
              </button>
              <button
                type="button"
                onClick={() => setStatus('محجوز')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all border ${
                  status === 'محجوز'
                    ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🟠 محجوز
              </button>
              <button
                type="button"
                onClick={() => setStatus('مباع')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all border ${
                  status === 'مباع'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🔴 مباع / نفد
              </button>
            </div>
          </div>

          {/* Product Image Upload or URL */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <label className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
              <span>📷 صورة المنتج (إمكانية التحميل أو إدخال الرابط)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="رابط الصورة (https://...)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                  <span>رفع صورة من الجهاز</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {imageUrl && (
              <div className="flex items-center gap-3 pt-1">
                <img
                  src={imageUrl}
                  alt="Product preview"
                  className="w-16 h-16 object-cover rounded-xl border-2 border-amber-400 shadow-sm shrink-0"
                />
                <div className="flex-1">
                  <span className="text-xs font-bold text-emerald-700 block">تم اختيار صورة المنتج بنجاح</span>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-[11px] font-bold text-rose-600 hover:underline mt-1"
                  >
                    حذف الصورة
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profit Summary Preview */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs shadow-md">
            <div>
              <span className="text-slate-300 font-bold block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                صافي هامش ربح القطعة (سعر البيع - مستحق المصنعة)
              </span>
              <span className="text-slate-400 text-[11px] block mt-0.5">
                سعر البيع: {formatCurrency(Number(salePrice) || 0)} | مستحق المصنعة: {formatCurrency(Number(manufacturerPay) || 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 text-[10px] block font-bold">ربح القطعة</span>
              <strong className="text-xl font-black text-emerald-300">
                {formatCurrency(calculatedProfit)}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm py-3 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              حفظ القطعة بالمخزون
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

