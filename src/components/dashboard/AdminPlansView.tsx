/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from 'react';
import subscriptionService from '../../services/subscriptionService';
import type { SubscriptionPlan, PaymentRevenue } from '../../services/subscriptionService';

export const AdminPlansView: React.FC = () => {
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

  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="space-y-6 select-none text-on-surface">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-title-lg text-title-lg font-bold">Admin Portal - Subscription Management</h2>
          <p className="text-secondary text-sm mt-1">Configure pricing plans, view revenue metrics, and moderate system storage tiers.</p>
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

      {/* Analytics Cards */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container-low border border-outline-variant p-6 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-secondary text-xs font-semibold uppercase tracking-wider">Total System Revenue</span>
              <h3 className="font-title-lg text-3xl font-black text-primary mt-1.5">{formatCurrency(revenue.totalRevenue)}</h3>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[28px] icon-fill">payments</span>
            </div>
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-6 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-secondary text-xs font-semibold uppercase tracking-wider">Total Transactions</span>
              <h3 className="font-title-lg text-3xl font-black text-on-surface mt-1.5">{revenue.totalTransactions}</h3>
            </div>
            <div className="w-12 h-12 bg-surface-variant rounded-xl flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[28px]">receipt_long</span>
            </div>
          </div>
        </div>
      )}

      {/* Create Plan Form */}
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
                  placeholder="e.g. PLUS, PRO, VIP"
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
                  placeholder="e.g. pdf,doc,docx,pptx,xls,xlsx,png,mp4"
                  className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-2 text-sm focus:border-primary outline-none"
                  value={allowedFormats}
                  onChange={(e) => setAllowedFormats(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Enter detailed plan description..."
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
                  <span>Enable Multi-Document Chat</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-sm">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant cursor-pointer"
                    checked={videoUpload}
                    onChange={(e) => setVideoUpload(e.target.checked)}
                  />
                  <span>Enable Video Upload</span>
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
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary/25 border-t-on-primary rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Plan</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Plans List */}
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container/30 flex justify-between items-center">
          <h3 className="font-title-md text-title-md font-bold">Active System Pricing Plans</h3>
          <span className="px-2.5 py-1 bg-surface-container rounded-md border text-xs font-semibold text-secondary">
            {plans.length} Total Plans
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-secondary text-sm font-medium">Fetching plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="p-12 text-center text-secondary">
            <span className="material-symbols-outlined text-[48px] opacity-40">layers_clear</span>
            <p className="mt-2 text-sm">No pricing plans have been configured yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/60">
            {plans.map((plan) => {
              const isFree = plan.price === 0;

              return (
                <div key={plan.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-surface-container/10 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-title-md text-title-md font-bold text-on-surface uppercase tracking-wide">
                        {plan.name}
                      </h4>
                      {isFree && (
                        <span className="px-2 py-0.5 bg-secondary/15 text-secondary text-[10px] font-bold rounded-md uppercase tracking-wider">
                          Default Free
                        </span>
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-secondary text-xs">{plan.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-on-surface-variant font-medium">
                      <span>Price: <strong className="text-on-surface">{formatCurrency(plan.price)}</strong></span>
                      <span>Duration: <strong className="text-on-surface">{plan.durationDays} days</strong></span>
                      <span>Storage: <strong className="text-on-surface">{plan.storageLimitGb} GB</strong></span>
                      <span>Max File Size: <strong className="text-on-surface">{plan.maxUploadSizeMb} MB</strong></span>
                      <span>Monthly Tokens: <strong className="text-on-surface">{plan.monthlyTokenLimit.toLocaleString()}</strong></span>
                      <span>Formats: <strong className="font-mono text-[10px] text-on-surface">{plan.allowedFormats}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleDeletePlan(plan)}
                      disabled={isFree}
                      className={`px-4 py-2 border text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                        isFree
                          ? 'border-outline-variant text-outline bg-surface-container cursor-not-allowed opacity-50'
                          : 'border-error/30 text-error hover:bg-error/10 hover:border-error active:scale-[0.98]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPlansView;
