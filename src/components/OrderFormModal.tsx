import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus, Product, Manufacturer, OrderSplitMode, OrderItem } from '../types';
import { formatCurrency, computeOrderShares } from '../utils/calculations';
import {
  X,
  ShoppingBag,
  Calculator,
  Percent,
  DollarSign,
  Edit3,
  ArrowUpRight,
  Search,
  Plus,
  Trash2,
  Package,
  Tag,
  Sparkles,
} from 'lucide-react';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderData: Partial<Order>) => void;
  initialOrder?: Order | null;
  products: Product[];
  manufacturers: Manufacturer[];
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialOrder,
  products,
  manufacturers,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<OrderStatus>('جديد');
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Multi-item Order Basket
  const [items, setItems] = useState<OrderItem[]>([]);

  // Smart Search & Item Builder State
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemCustomPrice, setItemCustomPrice] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Financial & Distribution Engine State
  const [shippingCost, setShippingCost] = useState(50);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [orderExpenses, setOrderExpenses] = useState(0);

  const [splitMode, setSplitMode] = useState<OrderSplitMode>('percentage');
  const [companyPercent, setCompanyPercent] = useState(40);
  const [manufacturerPercent, setManufacturerPercent] = useState(60);
  const [fixedCompanyAmount, setFixedCompanyAmount] = useState(200);
  const [manualCompanyShare, setManualCompanyShare] = useState(200);
  const [manualManufacturerShare, setManualManufacturerShare] = useState(250);

  // Filtered products for smart autocomplete
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (initialOrder) {
      setCustomerName(initialOrder.customerName || '');
      setPhone(initialOrder.phone || '');
      setAddress(initialOrder.address || '');
      setStatus(initialOrder.status || 'جديد');
      setOrderDate(initialOrder.date || new Date().toISOString().split('T')[0]);

      // Populate items
      if (initialOrder.items && initialOrder.items.length > 0) {
        setItems(initialOrder.items);
      } else if (initialOrder.productId) {
        // Fallback for older single-item orders
        setItems([
          {
            productId: initialOrder.productId,
            productName: initialOrder.productName || 'منتج',
            quantity: initialOrder.quantity || 1,
            salePrice: initialOrder.salePrice || 0,
            rawMaterialCostUnit: initialOrder.rawMaterialCostUnit || 0,
            workmanshipCostUnit: initialOrder.workmanshipCostUnit || 0,
            manufacturerName: initialOrder.manufacturerName || '',
          },
        ]);
      } else {
        setItems([]);
      }

      setShippingCost(initialOrder.shippingCost ?? 50);
      setDiscount(initialOrder.discount ?? 0);
      setPaidAmount(initialOrder.paidAmount ?? 0);
      setOrderExpenses(initialOrder.orderExpenses ?? 0);

      setSplitMode(initialOrder.splitMode || 'percentage');
      setCompanyPercent(initialOrder.companyPercent ?? 40);
      setManufacturerPercent(initialOrder.manufacturerPercent ?? 60);
      setFixedCompanyAmount(initialOrder.companyShare || 200);
      setManualCompanyShare(initialOrder.companyShare || 200);
      setManualManufacturerShare(initialOrder.manufacturerShare || 250);
    } else {
      setCustomerName('');
      setPhone('');
      setAddress('');
      setStatus('جديد');
      setOrderDate(new Date().toISOString().split('T')[0]);
      setItems([]);

      setShippingCost(50);
      setDiscount(0);
      setPaidAmount(0);
      setOrderExpenses(0);

      setSplitMode('percentage');
      setCompanyPercent(40);
      setManufacturerPercent(60);
      setFixedCompanyAmount(200);
      setManualCompanyShare(200);
      setManualManufacturerShare(250);

      // Default pick first product if available
      if (products.length > 0) {
        const firstProd = products[0];
        setItems([
          {
            productId: firstProd.id,
            productName: firstProd.name,
            quantity: 1,
            salePrice: firstProd.salePrice,
            rawMaterialCostUnit: firstProd.rawMaterialCost,
            workmanshipCostUnit: firstProd.workmanshipCost,
            manufacturerName: firstProd.manufacturerName,
          },
        ]);
        setPaidAmount(firstProd.salePrice + 50);
      }
    }
  }, [initialOrder, isOpen, products]);

  // Click outside listener to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle smart product selection from dropdown
  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setSearchQuery(`${prod.name} (${prod.id})`);
    setItemCustomPrice(prod.salePrice);
    setShowDropdown(false);
  };

  // Add selected item to basket
  const handleAddItemToBasket = () => {
    if (!selectedProduct) return;

    const newItem: OrderItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: Math.max(1, itemQuantity),
      salePrice: Number(itemCustomPrice || selectedProduct.salePrice),
      rawMaterialCostUnit: selectedProduct.rawMaterialCost,
      workmanshipCostUnit: selectedProduct.workmanshipCost && selectedProduct.workmanshipCost > 0
        ? selectedProduct.workmanshipCost
        : Math.round(Number(itemCustomPrice || selectedProduct.salePrice) * 0.60),
      manufacturerName: selectedProduct.manufacturerName,
      color: selectedProduct.color,
      governorate: selectedProduct.governorate,
      weightKg: selectedProduct.rawMaterialWeightKg,
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);

    // Recalculate default paid amount = Subtotal after discount + shipping
    const newItemsSale = updatedItems.reduce((sum, i) => sum + i.quantity * i.salePrice, 0);
    const newSubtotal = Math.max(0, newItemsSale - discount);
    setPaidAmount(newSubtotal + shippingCost);

    // Reset item builder input
    setSearchQuery('');
    setSelectedProduct(null);
    setItemQuantity(1);
    setItemCustomPrice(0);
  };

  // Remove item from basket
  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((_, idx) => idx !== index);
    setItems(updatedItems);

    const newItemsSale = updatedItems.reduce((sum, i) => sum + i.quantity * i.salePrice, 0);
    const newSubtotal = Math.max(0, newItemsSale - discount);
    setPaidAmount(newSubtotal + shippingCost);
  };

  // Update quantity for item in basket
  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    const qty = Math.max(1, newQty);
    const updatedItems = items.map((item, idx) =>
      idx === index ? { ...item, quantity: qty } : item
    );
    setItems(updatedItems);

    const newItemsSale = updatedItems.reduce((sum, i) => sum + i.quantity * i.salePrice, 0);
    const newSubtotal = Math.max(0, newItemsSale - discount);
    setPaidAmount(newSubtotal + shippingCost);
  };

  // Aggregate totals across all basket items
  const totalSale = items.reduce((sum, i) => sum + i.quantity * i.salePrice, 0);
  const totalRawCost = items.reduce((sum, i) => sum + i.quantity * i.rawMaterialCostUnit, 0);
  const totalWorkmanshipCost = items.reduce(
    (sum, i) => sum + i.quantity * i.workmanshipCostUnit,
    0
  );

  const calculatedShares = computeOrderShares(
    totalSale,
    shippingCost,
    discount,
    paidAmount,
    splitMode,
    companyPercent,
    manufacturerPercent,
    fixedCompanyAmount,
    manualCompanyShare,
    manualManufacturerShare,
    orderExpenses
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('يرجى إضافة منتج واحد على الأقل داخل سلة الأوردر');
      return;
    }

    const primaryItem = items[0];

    onSave({
      id: initialOrder ? initialOrder.id : `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      date: orderDate,
      customerName,
      phone,
      address,
      items,

      // Backward compatibility fields set from primary item
      productId: primaryItem.productId,
      productName: primaryItem.productName,
      quantity: items.reduce((sum, i) => sum + i.quantity, 0),
      salePrice: primaryItem.salePrice,
      manufacturerName: primaryItem.manufacturerName,
      rawMaterialCostUnit: primaryItem.rawMaterialCostUnit,
      workmanshipCostUnit: primaryItem.workmanshipCostUnit,

      shippingCost: Number(shippingCost),
      discount: Number(discount),
      paidAmount: Number(paidAmount),
      orderExpenses: Number(orderExpenses),
      status,

      totalSale,
      subtotalAfterDiscount: calculatedShares.subtotalAfterDiscount,
      totalRawCost,
      totalWorkmanshipCost,

      splitMode,
      companyPercent: Number(companyPercent),
      manufacturerPercent: Number(manufacturerPercent),
      companyShare: calculatedShares.companyShare,
      manufacturerShare: calculatedShares.manufacturerShare,
      totalAmountDue: calculatedShares.totalAmountDue,
      surplusProfit: calculatedShares.surplusProfit,
      profit: calculatedShares.profit,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-400" />
            <h3 className="font-extrabold text-base sm:text-lg">
              {initialOrder ? 'تعديل بيانات الأوردر' : 'إضافة أوردر جديد (WarshaStore)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {/* Customer Details Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              بيانات العميل والشحن
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  اسم العميل *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: أحمد محمود"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  رقم الهاتف *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 dir-ltr text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  عنوان التسليم *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="المحافظة - المنطقة - الشارع..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  حالة الأوردر *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="جديد">جديد</option>
                  <option value="قيد التنفيذ">قيد التنفيذ</option>
                  <option value="تم الشحن">تم الشحن</option>
                  <option value="تم التسليم">تم التسليم</option>
                  <option value="ملغي">ملغي</option>
                </select>
              </div>
            </div>
          </div>

          {/* Smart Autocomplete Product Search & Multiple Items Basket */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-4 h-4 text-blue-600" />
                البحث الذكي وإضافة منتجات لسلة الأوردر
              </h4>
              <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                إجمالي سلة المنتجات: {formatCurrency(totalSale)}
              </span>
            </div>

            {/* Smart Search Input with Autocomplete Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                البحث عن منتج (بالكود أو بالاسم)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="ابحث بكود المنتج أو اسمه... (مثال: PROD-101 أو فستان)"
                  className="w-full pr-10 pl-4 py-2.5 bg-white border border-blue-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>

              {/* Autocomplete Dropdown Menu */}
              {showDropdown && filteredProducts.length > 0 && (
                <div className="absolute z-30 right-0 left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {filteredProducts.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelectProduct(prod)}
                      className="w-full text-right p-3 hover:bg-blue-50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-extrabold text-sm text-slate-900 group-hover:text-blue-700">
                          {prod.name} ({prod.id})
                        </p>
                        <p className="text-xs text-slate-500">
                          الكود: <span className="font-mono text-slate-700 font-bold">{prod.id}</span> | الورشة: <strong className="text-slate-800">{prod.manufacturerName}</strong>
                          {prod.governorate && ` (${prod.governorate})`}
                          {prod.rawMaterialWeightKg && ` | الوزن: ${Math.round(prod.rawMaterialWeightKg * 1000)}جم`}
                          {prod.color && ` | اللون: ${prod.color}`}
                        </p>
                      </div>
                      <span className="font-black text-sm text-blue-600 bg-blue-50 group-hover:bg-blue-100 px-2.5 py-1 rounded-lg">
                        {formatCurrency(prod.salePrice)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Item Customizer Bar if product selected */}
            {selectedProduct && (
              <div className="bg-white p-3 rounded-xl border border-blue-200 space-y-2 animate-fadeIn">
                <p className="text-xs font-extrabold text-blue-900">
                  تجهيز إضافة: <span className="text-slate-900">{selectedProduct.name}</span>
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5">الكمية</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5">السعر للقطعة (ج.م)</label>
                    <input
                      type="number"
                      value={itemCustomPrice}
                      onChange={(e) => setItemCustomPrice(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItemToBasket}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-2 rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة للسلة
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Basket Items List */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>المنتجات المضافة في الأوردر ({items.length}):</span>
                <span className="text-[11px] text-slate-500">
                  إجمالي المصنعية: {formatCurrency(totalWorkmanshipCost)}
                </span>
              </h5>

              {items.length === 0 ? (
                <div className="p-4 text-center bg-white border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs font-bold">
                  لم يتم إضافة منتجات في سلة الأوردر بعد. استخدم خانة البحث أعلاه لإضافة منتجات.
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-900">
                            {item.productName} <span className="font-mono text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">({item.productId})</span>
                          </p>
                          <p className="text-[11px] text-slate-500">
                            سعر القطعة: <strong className="text-slate-800">{item.salePrice}ج</strong> | الورشة: <strong className="text-slate-800">{item.manufacturerName}</strong>
                            {item.governorate && ` (${item.governorate})`}
                            {item.weightKg && ` | الوزن: ${Math.round(item.weightKg * 1000)}جم`}
                            {item.color && ` | اللون: ${item.color}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-white text-slate-700 font-black hover:bg-slate-200 text-xs"
                          >
                            -
                          </button>
                          <span className="px-2 font-black text-xs text-slate-800">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-white text-slate-700 font-black hover:bg-slate-200 text-xs"
                          >
                            +
                          </button>
                        </div>

                        <strong className="font-black text-sm text-slate-900 min-w-[70px] text-left dir-ltr">
                          {formatCurrency(item.quantity * item.salePrice)}
                        </strong>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف المنتج من الأوردر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Financials & Discount Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              الحسابات المالية (الشحن، الخصم، المدفوع، زيادة التحصيل)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  قيمة الشحن (ج.م)
                </label>
                <input
                  type="number"
                  value={shippingCost}
                  onChange={(e) => {
                    const s = Number(e.target.value);
                    setShippingCost(s);
                    const subtotal = Math.max(0, totalSale - discount);
                    setPaidAmount(subtotal + s);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  الخصم الاختياري (ج.م)
                </label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => {
                    const d = Number(e.target.value);
                    setDiscount(d);
                    const subtotal = Math.max(0, totalSale - d);
                    setPaidAmount(subtotal + shippingCost);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-amber-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  المبلغ الفعلي المدفوع *
                </label>
                <input
                  type="number"
                  required
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-extrabold text-blue-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  مصروفات خاصة بالأوردر
                </label>
                <input
                  type="number"
                  value={orderExpenses}
                  onChange={(e) => setOrderExpenses(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-rose-700"
                />
              </div>
            </div>

            {/* Live Distribution Summary */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>إجمالي المطلوب من العميل (المنتجات بعد الخصم + الشحن):</span>
                <strong className="text-slate-900 font-extrabold">
                  {formatCurrency(calculatedShares.totalAmountDue)}
                </strong>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                  <span className="text-[10px] text-blue-700 block font-bold">مستحق الشركة</span>
                  <strong className="text-sm font-extrabold text-blue-900">
                    {formatCurrency(calculatedShares.companyShare)}
                  </strong>
                </div>

                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                  <span className="text-[10px] text-amber-700 block font-bold">مستحق المصنعة</span>
                  <strong className="text-sm font-extrabold text-amber-900">
                    {formatCurrency(calculatedShares.manufacturerShare)}
                  </strong>
                </div>
              </div>

              {/* Surplus Overpayment Collection Display */}
              {calculatedShares.surplusProfit > 0 && (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 animate-pulse">
                  <div className="flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-extrabold text-xs">حقل زيادة التحصيل (فرق الربح المباشر)</p>
                      <p className="text-[10px] text-emerald-600">
                        المدفوع من العميل يزيد عن المطلوب الإجمالي
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-black text-emerald-700">
                    +{formatCurrency(calculatedShares.surplusProfit)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Distribution Engine Split Mode Section */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-blue-400 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" />
                  نظام توزيع قيمة الأوردر
                </h4>
                <p className="text-[11px] text-slate-400">
                  حدد طريقة تقسيم المستحقات بين الشركة والمصنّعة
                </p>
              </div>

              {/* Selector Tabs for Split Mode */}
              <div className="flex bg-slate-800 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setSplitMode('percentage')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    splitMode === 'percentage'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  نسبة مئوية
                </button>

                <button
                  type="button"
                  onClick={() => setSplitMode('fixed')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    splitMode === 'fixed'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  مبلغ ثابت
                </button>

                <button
                  type="button"
                  onClick={() => setSplitMode('manual')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    splitMode === 'manual'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  إدخال يدوي
                </button>
              </div>
            </div>

            {/* Split Mode Inputs depending on selection */}
            {splitMode === 'percentage' && (
              <div className="grid grid-cols-2 gap-3 bg-slate-800/60 p-3 rounded-xl">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    نسبة الشركة (المقابلة: {companyPercent}%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={companyPercent}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCompanyPercent(val);
                      setManufacturerPercent(Math.max(0, 100 - val));
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-blue-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    نسبة المصنّعة (المقابلة: {manufacturerPercent}%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={manufacturerPercent}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setManufacturerPercent(val);
                      setCompanyPercent(Math.max(0, 100 - val));
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-amber-400"
                  />
                </div>
              </div>
            )}

            {splitMode === 'fixed' && (
              <div className="bg-slate-800/60 p-3 rounded-xl space-y-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    حدد مبلغ ثابت مستحق للشركة (ج.م)
                  </label>
                  <input
                    type="number"
                    value={fixedCompanyAmount}
                    onChange={(e) => setFixedCompanyAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-blue-400"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  * الباقي تلقائياً لمستحق المصنعة: {' '}
                  <span className="text-amber-400 font-bold">
                    {formatCurrency(Math.max(0, calculatedShares.subtotalAfterDiscount - fixedCompanyAmount))}
                  </span>
                </p>
              </div>
            )}

            {splitMode === 'manual' && (
              <div className="grid grid-cols-2 gap-3 bg-slate-800/60 p-3 rounded-xl">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    مستحق الشركة يدوياً (ج.م)
                  </label>
                  <input
                    type="number"
                    value={manualCompanyShare}
                    onChange={(e) => setManualCompanyShare(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-blue-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    مستحق المصنعة يدوياً (ج.م)
                  </label>
                  <input
                    type="number"
                    value={manualManufacturerShare}
                    onChange={(e) => setManualManufacturerShare(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-amber-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30"
            >
              حفظ وتطبيق توزيع الأوردر
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-5 py-3.5 rounded-xl transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

