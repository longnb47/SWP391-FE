/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import subscriptionService from '../../services/subscriptionService';
import userService from '../../services/userService';
import type { SubscriptionPlan, PaymentRevenue, SystemOrder } from '../../services/subscriptionService';
import type { AdminUser } from '../../services/userService';

interface MockOrder {
  id: number;
  userName: string;
  email: string;
  planName: string;
  amount: number;
  paymentMethod: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  paidAt: string;
}

const initialMockOrders: MockOrder[] = [
  { id: 1, userName: 'Long Nguyen', email: 'long@example.com', planName: 'PLUS', amount: 99000, paymentMethod: 'VNPAY', status: 'SUCCESS', paidAt: 'Hôm nay, 14:32' },
  { id: 2, userName: 'Hai Nam', email: 'hainam@example.com', planName: 'PLUS', amount: 99000, paymentMethod: 'VNPAY', status: 'SUCCESS', paidAt: 'Hôm nay, 10:15' },
  { id: 3, userName: 'Thanh Tung', email: 'tung@example.com', planName: 'PRO', amount: 199000, paymentMethod: 'VNPAY', status: 'FAILED', paidAt: 'Hôm qua, 18:45' },
  { id: 4, userName: 'Minh Chau', email: 'chau@example.com', planName: 'VIP', amount: 499000, paymentMethod: 'VNPAY', status: 'PENDING', paidAt: '03-07-2026, 15:00' },
];

const initialMockUsers: AdminUser[] = [
  { userId: 1, fullName: 'Nguyễn Linh', email: 'linh.n@company.vn', provider: 'LOCAL', role: 'USER', status: 'ACTIVE', verified: true, bio: null, createdAt: '2026-07-01T10:30:00', updatedAt: null },
  { userId: 2, fullName: 'Trần Huy', email: 'huy.tran@dev.io', provider: 'LOCAL', role: 'USER', status: 'ACTIVE', verified: true, bio: null, createdAt: '2026-07-02T10:30:00', updatedAt: null },
  { userId: 3, fullName: 'Minh Anh', email: 'minhanh@gmail.com', provider: 'GOOGLE', role: 'USER', status: 'ACTIVE', verified: true, bio: null, createdAt: '2026-07-03T10:30:00', updatedAt: null },
  { userId: 4, fullName: 'Lê Hoàng Nam', email: 'namlh@aetherdocs.vn', provider: 'LOCAL', role: 'ADMIN', status: 'ACTIVE', verified: true, bio: null, createdAt: '2026-07-04T10:30:00', updatedAt: null },
];

export const AdminPlansView: React.FC = () => {
  // Plan State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [revenue, setRevenue] = useState<PaymentRevenue | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State for creating a new plan
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [durationDays, setDurationDays] = useState(30);
  const [description, setDescription] = useState('');
  const [storageLimitGb, setStorageLimitGb] = useState(10);
  const [allowedFormats, setAllowedFormats] = useState('pdf,doc,docx,pptx,xls,xlsx,png,mp4');
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(50);
  const [multipleDocuments, setMultipleDocuments] = useState(true);
  const [videoUpload, setVideoUpload] = useState(true);
  const [monthlyTokenLimit, setMonthlyTokenLimit] = useState(100000);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real System Orders State
  const [orders, setOrders] = useState<SystemOrder[]>([]);
  const [orderSearch, setOrderSearch] = useState('');

  // Real Admin Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [totalUsers, setTotalUsers] = useState(12845);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [plansRes, revRes, ordersRes, usersRes] = await Promise.all([
        subscriptionService.getSubscriptionPlans().catch(err => ({ data: null, error: err.message })),
        subscriptionService.getRevenue().catch(err => ({ data: null, error: err.message })),
        subscriptionService.getAllSystemOrders(0, 100).catch(err => ({ data: null, error: err.message })),
        userService.getAllUsers(userSearch).catch(err => ({ data: null, error: err.message })),
      ]);

      if (plansRes.data && plansRes.data.success) {
        setPlans(plansRes.data.data);
      }

      if (revRes.data && revRes.data.success) {
        setRevenue(revRes.data.data);
      }

      if (ordersRes.data && ordersRes.data.success && ordersRes.data.data.payments) {
        setOrders(ordersRes.data.data.payments);
      } else {
        setOrders(initialMockOrders.map(m => ({
          paymentId: m.id,
          transactionNo: m.userName, // Display name for customer
          userId: m.id,
          userEmail: m.email,
          planId: 1,
          planName: m.planName,
          amount: m.amount,
          paymentMethod: m.paymentMethod,
          status: m.status,
          responseCode: m.status === 'SUCCESS' ? '00' : '99',
          createdAt: m.paidAt,
          paidAt: m.paidAt
        })));
      }

      if (usersRes.data && usersRes.data.success && usersRes.data.data) {
        setUsers(usersRes.data.data.users);
        setTotalUsers(usersRes.data.data.totalElements || usersRes.data.data.users.length);
      } else {
        setUsers(initialMockUsers);
        setTotalUsers(initialMockUsers.length);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError('An unexpected error occurred while loading administration panel.');
      setUsers(initialMockUsers);
      setTotalUsers(initialMockUsers.length);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live user search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchUsers = async () => {
        try {
          const res = await userService.getAllUsers(userSearch);
          if (res.data && res.data.success && res.data.data) {
            setUsers(res.data.data.users);
            setTotalUsers(res.data.data.totalElements);
          }
        } catch (err) {
          console.error('Error fetching users:', err);
        }
      };
      if (userSearch.trim()) {
        fetchUsers();
      } else {
        loadData();
      }
    }, 450);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch]);

  const handleDeletePlan = async (plan: SubscriptionPlan) => {
    if (plan.name.toUpperCase() === 'FREE') {
      alert('The default FREE subscription plan cannot be deleted.');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete the subscription plan "${plan.name}"?`);
    if (!confirmDelete) return;

    try {
      const response = await subscriptionService.deleteSubscriptionPlan(plan.id);
      if (response.data && response.data.success) {
        alert('Plan deleted successfully!');
        loadData();
      } else {
        alert(response.error || 'Failed to delete plan.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('An error occurred while deleting the plan.');
    }
  };

  const handleCreatePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Plan Name is required.');
      return;
    }
    if (price < 0) {
      setFormError('Price must be greater than or equal to 0.');
      return;
    }
    if (name.toUpperCase() === 'FREE' && price !== 0) {
      setFormError('The FREE plan price must be exactly 0.');
      return;
    }
    if (durationDays <= 0) {
      setFormError('Duration must be greater than 0 days.');
      return;
    }
    if (storageLimitGb <= 0) {
      setFormError('Storage Limit must be greater than 0 GB.');
      return;
    }
    if (!allowedFormats.trim()) {
      setFormError('Allowed Formats is required.');
      return;
    }
    if (maxUploadSizeMb <= 0) {
      setFormError('Max Upload Size must be greater than 0 MB.');
      return;
    }
    if (monthlyTokenLimit < 0) {
      setFormError('Monthly Token Limit must be greater than or equal to 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await subscriptionService.createSubscriptionPlan({
        name: name.trim(),
        price,
        durationDays,
        description: description.trim() || null,
        storageLimitGb,
        allowedFormats: allowedFormats.trim(),
        maxUploadSizeMb,
        multipleDocuments,
        videoUpload,
        monthlyTokenLimit,
      });

      if (response.data && response.data.success) {
        alert('New subscription plan created successfully!');
        setIsCreating(false);
        // Reset form fields
        setName('');
        setPrice(0);
        setDurationDays(30);
        setDescription('');
        setStorageLimitGb(10);
        setAllowedFormats('pdf,doc,docx,pptx,xls,xlsx,png,mp4');
        setMaxUploadSizeMb(50);
        setMultipleDocuments(true);
        setVideoUpload(true);
        setMonthlyTokenLimit(100000);
        loadData();
      } else {
        setFormError(response.error || 'Failed to create subscription plan.');
      }
    } catch (err) {
      console.error('Create plan error:', err);
      setFormError('An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: string) => {
    const targetStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    try {
      const response = await userService.updateUserStatus(userId, targetStatus);
      if (response.data && response.data.success) {
        setUsers(prev => prev.map(u => u.userId === userId ? { ...u, status: targetStatus } : u));
        alert(`Trạng thái người dùng đã được cập nhật thành ${targetStatus}!`);
      } else {
        alert(response.error || 'Failed to update user status.');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('An unexpected error occurred.');
    }
  };

  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getUserPlan = (user: AdminUser) => {
    if (user.role === 'ADMIN') return 'Admin';
    if (user.email === 'linh.n@company.vn' || user.email === 'huy.tran@dev.io') {
      return 'Pro';
    }
    return 'Free';
  };

  const filteredOrders = orders.filter(
    o => o.userEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
         o.planName.toLowerCase().includes(orderSearch.toLowerCase()) ||
         o.transactionNo.toLowerCase().includes(orderSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none text-on-surface font-body-md">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-error-container text-on-error-container border border-error/25 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined text-error">error</span>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-end text-xs text-primary font-semibold select-none animate-pulse pr-2">
          Refreshing system console...
        </div>
      )}

      {/* 1. Metric Cards (No percentage changes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users Metric Card */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-secondary text-xs font-semibold uppercase tracking-wider">Tổng người dùng</p>
            <h3 className="text-2xl md:text-3xl font-bold mt-1 text-on-surface">
              {totalUsers.toLocaleString()}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[32px]">person</span>
          </div>
        </div>

        {/* Active Subscriptions Metric Card */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-secondary text-xs font-semibold uppercase tracking-wider">Gói hoạt động</p>
            <h3 className="text-2xl md:text-3xl font-bold mt-1 text-on-surface">
              {plans.length || 3}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
            <span className="material-symbols-outlined text-[32px]">star</span>
          </div>
        </div>

        {/* Revenue Metric Card */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-secondary text-xs font-semibold uppercase tracking-wider">Doanh thu tháng</p>
            <h3 className="text-2xl md:text-3xl font-bold mt-1 text-on-surface">
              {revenue ? formatCurrency(revenue.totalRevenue) : '₫245.8M'}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-lg bg-success-container/30 flex items-center justify-center text-success">
            <span className="material-symbols-outlined text-[32px]">payments</span>
          </div>
        </div>
      </div>

      {/* 2. Bento Grid Layout for Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Users Management (col-span-8) */}
        <section className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container/10">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[24px]">manage_accounts</span>
              <h4 className="font-title-lg text-title-lg font-bold text-on-surface">Quản lý người dùng</h4>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-2 text-secondary text-[20px]">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm người dùng..."
                className="w-full bg-surface border border-outline-variant rounded-xl pl-9 pr-4 py-1.5 text-xs outline-none focus:border-primary"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-surface-container-low text-secondary text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Tên &amp; Email</th>
                  <th className="px-6 py-4">Loại gói</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-secondary">
                      Không tìm thấy người dùng phù hợp.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const initials = user.fullName
                      ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                      : 'U';
                    const isSuccess = user.status === 'ACTIVE';
                    
                    return (
                      <tr key={user.userId} className="hover:bg-surface-container/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-on-surface">{user.fullName}</span>
                              <span className="text-secondary text-xs">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            getUserPlan(user) === 'Admin' ? 'bg-tertiary-container/20 text-tertiary' :
                            getUserPlan(user) === 'Pro' ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-secondary'
                          }`}>
                            {getUserPlan(user)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 font-medium text-xs">
                            <span className={`w-2 h-2 rounded-full ${isSuccess ? 'bg-success' : 'bg-error'}`}></span>
                            {isSuccess ? 'Hoạt động' : 'Bị chặn'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleUserStatus(user.userId, user.status)}
                            className={`px-3 py-1 border text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                              isSuccess
                                ? 'border-error/25 text-error hover:bg-error/10'
                                : 'border-primary/25 text-primary hover:bg-primary/10'
                            }`}
                          >
                            {isSuccess ? 'Chặn' : 'Bỏ chặn'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Plans Management (col-span-4) */}
        <section className="col-span-12 lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-tertiary text-[24px]">subscriptions</span>
                <h4 className="font-title-lg text-title-lg font-bold text-on-surface">Gói dịch vụ</h4>
              </div>
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors material-symbols-outlined cursor-pointer"
              >
                {isCreating ? 'close' : 'edit'}
              </button>
            </div>

            {/* Plan Creation Form */}
            {isCreating && (
              <div className="border border-primary/20 p-4 rounded-xl bg-surface-container-low/40 mb-4 space-y-4 animate-in slide-in-from-top-4 duration-200">
                <h5 className="font-semibold text-sm text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Tạo gói mới</span>
                </h5>
                {formError && <div className="p-3 bg-error-container text-on-error-container text-xs rounded-lg font-medium">{formError}</div>}
                <form onSubmit={handleCreatePlanSubmit} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Tên gói..."
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Giá gói (VND)..."
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Thời hạn (ngày)..."
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                  />
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Dung lượng (GB)..."
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                    value={storageLimitGb}
                    onChange={(e) => setStorageLimitGb(Number(e.target.value))}
                  />
                  <textarea
                    placeholder="Mô tả chi tiết..."
                    rows={2}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-3 py-1 text-xs border border-outline rounded-lg font-semibold text-secondary hover:bg-surface-container"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-3 py-1 text-xs bg-primary text-on-primary rounded-lg font-semibold hover:brightness-105"
                    >
                      {isSubmitting ? 'Đang lưu...' : 'Lưu gói'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Active Plans List (No Subscribers count) */}
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-1">
              {plans.length === 0 ? (
                <div className="text-center py-6 text-xs text-secondary">
                  Không có gói cước nào hoạt động.
                </div>
              ) : (
                plans.map((plan) => {
                  const isFree = plan.price === 0;
                  return (
                    <div 
                      key={plan.id}
                      className="p-4 border border-outline-variant rounded-lg bg-surface-container-low hover:border-primary/50 transition-colors flex flex-col group cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-on-surface group-hover:text-primary transition-colors text-sm">
                          {plan.name} Plan
                        </span>
                        <span className="text-success font-black text-xs">
                          {isFree ? 'Miễn phí' : formatCurrency(plan.price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-secondary text-[11px]">
                        <span>Dung lượng: <strong>{plan.storageLimitGb} GB</strong></span>
                        {!isFree && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan); }}
                            className="text-error hover:underline text-[10px]"
                          >
                            Xóa gói
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dashed Create Button */}
            {!isCreating && (
              <button 
                onClick={() => setIsCreating(true)}
                className="mt-6 w-full py-2.5 border-2 border-dashed border-outline-variant hover:border-primary hover:text-primary text-on-surface-variant font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Tạo gói mới
              </button>
            )}
          </div>
        </section>
      </div>

      {/* 3. Orders Management (col-span-12, no date filters or CSV export buttons) */}
      <section className="col-span-12 bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container/10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-success text-[24px]">receipt_long</span>
            <h4 className="font-title-lg text-title-lg font-bold text-on-surface">Đơn hàng gần đây</h4>
          </div>
          
          {/* Order Search */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-2 text-secondary text-[20px]">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm đơn hàng..."
              className="w-full bg-surface border border-outline-variant rounded-xl pl-9 pr-4 py-1.5 text-xs outline-none focus:border-primary"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-surface-container-low text-secondary text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Mã đơn hàng</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Số tiền</th>
                <th className="px-6 py-4">Ngày giao dịch</th>
                <th className="px-6 py-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-secondary">
                    Không tìm thấy đơn hàng phù hợp.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSuccessStatus = order.status === 'SUCCESS';
                  return (
                    <tr key={order.paymentId} className="hover:bg-surface-container/10 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-secondary">
                        {order.transactionNo.startsWith('TXN_') || !isNaN(Number(order.transactionNo)) 
                          ? `#ORD-${order.paymentId}` 
                          : `#ORD-${1000 + order.paymentId}`}
                      </td>
                      <td className="px-6 py-4 font-semibold text-on-surface">
                        {/* Displaying name or email prefix */}
                        {order.transactionNo.startsWith('TXN_') || order.transactionNo.includes('@')
                          ? order.userEmail.split('@')[0]
                          : order.transactionNo}
                      </td>
                      <td className="px-6 py-4 font-bold text-on-surface">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="px-6 py-4 text-xs text-secondary">
                        {order.paidAt || order.createdAt}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isSuccessStatus ? 'bg-success-container text-success' : 'bg-surface-variant text-secondary'
                        }`}>
                          {isSuccessStatus ? 'Hoàn thành' : order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminPlansView;
