/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import subscriptionService from '../../services/subscriptionService';
import type { SubscriptionPlan, PaymentRevenue } from '../../services/subscriptionService';

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

interface MockUser {
  id: number;
  fullName: string;
  email: string;
  role: 'USER' | 'ADMIN';
  planName: string;
  storageUsedGb: number;
  storageLimitGb: number;
  status: 'ACTIVE' | 'BLOCKED';
  joinedAt: string;
}

const initialMockOrders: MockOrder[] = [
  { id: 1, userName: 'Long Nguyen', email: 'long@example.com', planName: 'PLUS', amount: 99000, paymentMethod: 'VNPAY', status: 'SUCCESS', paidAt: '2026-07-03 10:35:00' },
  { id: 2, userName: 'Hai Nam', email: 'hainam@example.com', planName: 'PLUS', amount: 99000, paymentMethod: 'VNPAY', status: 'SUCCESS', paidAt: '2026-07-02 14:22:15' },
  { id: 3, userName: 'Thanh Tung', email: 'tung@example.com', planName: 'PRO', amount: 199000, paymentMethod: 'VNPAY', status: 'FAILED', paidAt: '2026-07-01 09:12:44' },
  { id: 4, userName: 'Minh Chau', email: 'chau@example.com', planName: 'VIP', amount: 499000, paymentMethod: 'VNPAY', status: 'PENDING', paidAt: '2026-07-03 15:00:00' },
];

const initialMockUsers: MockUser[] = [
  { id: 1, fullName: 'Long Nguyen', email: 'long@example.com', role: 'ADMIN', planName: 'PLUS', storageUsedGb: 1.5, storageLimitGb: 10, status: 'ACTIVE', joinedAt: '2026-06-14' },
  { id: 2, fullName: 'Hai Nam', email: 'hainam@example.com', role: 'USER', planName: 'PLUS', storageUsedGb: 4.2, storageLimitGb: 10, status: 'ACTIVE', joinedAt: '2026-06-18' },
  { id: 3, fullName: 'Thanh Tung', email: 'tung@example.com', role: 'USER', planName: 'FREE', storageUsedGb: 0.1, storageLimitGb: 2, status: 'ACTIVE', joinedAt: '2026-06-20' },
  { id: 4, fullName: 'Minh Chau', email: 'chau@example.com', role: 'USER', planName: 'FREE', storageUsedGb: 1.9, storageLimitGb: 2, status: 'BLOCKED', joinedAt: '2026-06-21' },
];

export const AdminPlansView: React.FC = () => {
  const [nestedTab, setNestedTab] = useState<'plans' | 'orders' | 'users'>('plans');

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

  // Mock Orders State
  const [orders] = useState<MockOrder[]>(initialMockOrders);
  const [orderSearch, setOrderSearch] = useState('');

  // Mock Users State
  const [users, setUsers] = useState<MockUser[]>(initialMockUsers);
  const [userSearch, setUserSearch] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [plansRes, revRes] = await Promise.all([
        subscriptionService.getSubscriptionPlans(),
        subscriptionService.getRevenue(),
      ]);

      if (plansRes.data && plansRes.data.success) {
        setPlans(plansRes.data.data);
      } else {
        setError(plansRes.error || 'Failed to load subscription plans.');
      }

      if (revRes.data && revRes.data.success) {
        setRevenue(revRes.data.data);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError('An unexpected error occurred while loading administration panel.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const toggleUserStatus = (id: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        alert(`Status of user ${u.fullName} is now set to ${nextStatus}.`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const toggleUserRole = (id: number) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
        alert(`Role of user ${u.fullName} is now set to ${nextRole}.`);
        return { ...u, role: nextRole };
      }
      return u;
    }));
  };

  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const filteredOrders = orders.filter(
    o => o.userName.toLowerCase().includes(orderSearch.toLowerCase()) || 
         o.email.toLowerCase().includes(orderSearch.toLowerCase()) ||
         o.planName.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const filteredUsers = users.filter(
    u => u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
         u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 select-none text-on-surface font-body-md">
      {/* 1. Admin Nested Sidebar (Left side) */}
      <div className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-1 bg-surface-container-low border border-outline-variant rounded-2xl p-3 h-fit">
        <button
          onClick={() => setNestedTab('plans')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            nestedTab === 'plans'
              ? 'bg-primary/10 text-primary border-l-4 border-primary rounded-l-none'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          <span>Manage Plans</span>
        </button>

        <button
          onClick={() => setNestedTab('orders')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            nestedTab === 'orders'
              ? 'bg-primary/10 text-primary border-l-4 border-primary rounded-l-none'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          <span>Manage Orders</span>
        </button>

        <button
          onClick={() => setNestedTab('users')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
            nestedTab === 'users'
              ? 'bg-primary/10 text-primary border-l-4 border-primary rounded-l-none'
              : 'text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">group</span>
          <span>Manage Users</span>
        </button>
      </div>

      {/* 2. Admin Content Workspace (Right side) */}
      <div className="flex-1 space-y-6">
        {nestedTab === 'plans' && (
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-title-lg text-title-lg font-bold">Pricing Plans</h2>
                <p className="text-secondary text-sm mt-1">Configure pricing tiers, adjust storage constraints, and toggle AI limitations.</p>
              </div>
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="px-4 py-2 bg-primary text-on-primary hover:bg-on-primary-fixed-variant rounded-xl font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-[0_2px_4px_rgba(160,65,0,0.2)] active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isCreating ? 'close' : 'add'}
                </span>
                <span>{isCreating ? 'Cancel' : 'Create New Plan'}</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-error-container text-on-error-container border border-error/25 rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-error">error</span>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Revenue Analytics */}
            {revenue && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-container-low border border-outline-variant p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-secondary text-xs font-semibold uppercase tracking-wider">Total System Revenue</span>
                    <h3 className="font-title-lg text-2xl font-black text-primary mt-1">{formatCurrency(revenue.totalRevenue)}</h3>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[24px] icon-fill">payments</span>
                  </div>
                </div>
                <div className="bg-surface-container-low border border-outline-variant p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-secondary text-xs font-semibold uppercase tracking-wider">Total Transactions</span>
                    <h3 className="font-title-lg text-2xl font-black text-on-surface mt-1">{revenue.totalTransactions}</h3>
                  </div>
                  <div className="w-10 h-10 bg-surface-variant rounded-xl flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                  </div>
                </div>
              </div>
            )}

            {/* Plan Creation Form */}
            {isCreating && (
              <div className="bg-surface-container-low border border-primary/30 p-6 rounded-2xl shadow-sm animate-in slide-in-from-top-4 duration-250">
                <h3 className="font-title-md text-title-md font-bold mb-4 flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">design_services</span>
                  <span>Configure Pricing Plan</span>
                </h3>
                {formError && (
                  <div className="p-4 mb-4 bg-error-container text-on-error-container border border-error/25 rounded-xl text-sm font-medium">
                    {formError}
                  </div>
                )}
                <form onSubmit={handleCreatePlanSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Plan Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. PLUS, VIP"
                        className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary outline-none"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Price (VND) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="e.g. 99000"
                        className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary outline-none"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Duration (Days) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary outline-none"
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Storage Limit (GB) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary outline-none"
                        value={storageLimitGb}
                        onChange={(e) => setStorageLimitGb(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Max Upload Size (MB) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary outline-none"
                        value={maxUploadSizeMb}
                        onChange={(e) => setMaxUploadSizeMb(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Monthly Token Limit *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary outline-none"
                        value={monthlyTokenLimit}
                        onChange={(e) => setMonthlyTokenLimit(Number(e.target.value))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Allowed Formats *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. pdf,doc,docx,pptx"
                        className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary outline-none"
                        value={allowedFormats}
                        onChange={(e) => setAllowedFormats(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Description</label>
                      <textarea
                        placeholder="Enter detailed description..."
                        rows={2}
                        className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary outline-none resize-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-6 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                          checked={multipleDocuments}
                          onChange={(e) => setMultipleDocuments(e.target.checked)}
                        />
                        <span>Multi-Document Chat</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                          checked={videoUpload}
                          onChange={(e) => setVideoUpload(e.target.checked)}
                        />
                        <span>Video Upload</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 border border-outline text-secondary hover:bg-surface-container rounded-xl font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-primary text-on-primary hover:bg-on-primary-fixed-variant rounded-xl font-semibold cursor-pointer flex items-center gap-2 shadow-[0_2px_4px_rgba(160,65,0,0.2)]"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Plan'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Active Plans List */}
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-outline-variant bg-surface-container/30">
                <h3 className="font-title-md text-title-md font-bold">Active System Pricing Plans</h3>
              </div>
              {isLoading ? (
                <div className="p-12 text-center text-secondary">
                  <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium">Fetching plans...</p>
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/60">
                  {plans.map((plan) => {
                    const isFree = plan.price === 0;
                    return (
                      <div key={plan.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container/10 transition-colors">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-title-md text-title-md font-bold text-on-surface uppercase tracking-wide">{plan.name}</h4>
                            {isFree && <span className="px-2 py-0.5 bg-secondary/15 text-secondary text-[9px] font-bold rounded uppercase tracking-wider">Free</span>}
                          </div>
                          {plan.description && <p className="text-secondary text-xs">{plan.description}</p>}
                          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-on-surface-variant font-medium">
                            <span>Price: <strong>{formatCurrency(plan.price)}</strong></span>
                            <span>Storage: <strong>{plan.storageLimitGb} GB</strong></span>
                            <span>Tokens: <strong>{plan.monthlyTokenLimit.toLocaleString()}</strong></span>
                            <span>Formats: <strong className="font-mono text-[9px] text-on-surface">{plan.allowedFormats}</strong></span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePlan(plan)}
                          disabled={isFree}
                          className={`px-3 py-1.5 border text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                            isFree
                              ? 'border-outline-variant text-outline bg-surface-container cursor-not-allowed opacity-50'
                              : 'border-error/30 text-error hover:bg-error/10 hover:border-error active:scale-[0.98]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          <span>Delete Plan</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {nestedTab === 'orders' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-title-lg text-title-lg font-bold">System Orders</h2>
              <p className="text-secondary text-sm mt-1">Review Sandbox VNPay subscriptions purchase logs and payment history records.</p>
            </div>

            {/* Filter and Notice */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface-container-low border border-outline-variant p-4 rounded-2xl">
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[20px]">search</span>
                <input
                  type="text"
                  placeholder="Search user, email or plan..."
                  className="w-full bg-surface border border-outline-variant rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-primary"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-md border text-xs font-semibold text-secondary">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Mock Data (TODO: Integrate global orders API)</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant text-secondary font-bold select-none text-xs uppercase tracking-wider">
                    <th className="p-4">Txn ID</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Plan Name</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-secondary">No orders match search query.</td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-surface-container/10 transition-colors">
                        <td className="p-4 font-mono text-xs text-secondary">TXN_{1000 + order.id}</td>
                        <td className="p-4">
                          <div className="font-semibold">{order.userName}</div>
                          <div className="text-secondary text-xs">{order.email}</div>
                        </td>
                        <td className="p-4 font-bold text-xs uppercase">{order.planName}</td>
                        <td className="p-4 font-semibold">{formatCurrency(order.amount)}</td>
                        <td className="p-4 text-xs font-semibold text-secondary">{order.paymentMethod}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            order.status === 'SUCCESS' ? 'bg-primary/10 text-primary' :
                            order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : 'bg-error/10 text-error'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-secondary">{order.paidAt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {nestedTab === 'users' && (
          <div className="space-y-4">
            <div>
              <h2 className="font-title-lg text-title-lg font-bold">System Users</h2>
              <p className="text-secondary text-sm mt-1">Review active member roles, toggle account statuses, and moderate student storage limits.</p>
            </div>

            {/* Filter and Notice */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface-container-low border border-outline-variant p-4 rounded-2xl">
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[20px]">search</span>
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  className="w-full bg-surface border border-outline-variant rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:border-primary"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-md border text-xs font-semibold text-secondary">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Mock Data (TODO: Integrate users API)</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant text-secondary font-bold select-none text-xs uppercase tracking-wider">
                    <th className="p-4">ID</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Subscription</th>
                    <th className="p-4">Storage Used</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-secondary">No users match search query.</td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-surface-container/10 transition-colors">
                        <td className="p-4 font-mono text-xs text-secondary">#{user.id}</td>
                        <td className="p-4">
                          <div className="font-semibold">{user.fullName}</div>
                          <div className="text-secondary text-xs">{user.email}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            user.role === 'ADMIN' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-surface-container border border-outline-variant text-secondary'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-xs uppercase">{user.planName}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs">{user.storageUsedGb} / {user.storageLimitGb} GB</span>
                            <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden border">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${(user.storageUsedGb / user.storageLimitGb) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            user.status === 'ACTIVE' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => toggleUserRole(user.id)}
                              className="px-2.5 py-1.5 border border-outline-variant text-secondary hover:text-on-surface hover:bg-surface-container text-xs font-semibold rounded-lg cursor-pointer"
                            >
                              Toggle Role
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className={`px-2.5 py-1.5 border text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                                user.status === 'ACTIVE'
                                  ? 'border-error/20 text-error hover:bg-error/10'
                                  : 'border-primary/20 text-primary hover:bg-primary/10'
                              }`}
                            >
                              {user.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPlansView;
