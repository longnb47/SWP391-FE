import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';
import type { BackendResponse } from './documentService';

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  description: string | null;
  storageLimitGb: number;
  allowedFormats: string;
  maxUploadSizeMb: number;
  multipleDocuments: boolean;
  videoUpload: boolean;
  monthlyTokenLimit: number;
  active: boolean;
}

export interface UserSubscription {
  subscriptionId: number;
  status: string; // e.g. "ACTIVE", "EXPIRED"
  startDate: string;
  endDate: string;
  planName: string;
  price: number;
  durationDays: number;
  storageLimitGb: number;
  allowedFormats: string;
  maxUploadSizeMb: number;
  multipleDocuments: boolean;
  videoUpload: boolean;
  monthlyTokenLimit: number;
}

export interface PaymentRevenue {
  totalRevenue: number;
  totalTransactions: number;
}

export interface PurchaseResponse {
  paymentId: number;
  transactionNo: string;
  paymentUrl: string;
  status: string;
}

export const subscriptionService = {
  async getSubscriptionPlans(): Promise<ApiResponse<BackendResponse<SubscriptionPlan[]>>> {
    return apiClient.get<BackendResponse<SubscriptionPlan[]>>('/subscription-plans');
  },

  async getSubscriptionPlanDetail(id: number): Promise<ApiResponse<BackendResponse<SubscriptionPlan>>> {
    return apiClient.get<BackendResponse<SubscriptionPlan>>(`/subscription-plans/${id}`);
  },

  async createSubscriptionPlan(plan: Omit<SubscriptionPlan, 'id' | 'active'>): Promise<ApiResponse<BackendResponse<SubscriptionPlan>>> {
    return apiClient.post<BackendResponse<SubscriptionPlan>>('/subscription-plans', plan);
  },

  async updateSubscriptionPlan(id: number, plan: Omit<SubscriptionPlan, 'id' | 'active'>): Promise<ApiResponse<BackendResponse<SubscriptionPlan>>> {
    return apiClient.put<BackendResponse<SubscriptionPlan>>(`/subscription-plans/${id}`, plan);
  },

  async deleteSubscriptionPlan(id: number): Promise<ApiResponse<BackendResponse<null>>> {
    return apiClient.delete<BackendResponse<null>>(`/subscription-plans/${id}`);
  },

  async purchasePlan(planId: number): Promise<ApiResponse<BackendResponse<PurchaseResponse>>> {
    return apiClient.post<BackendResponse<PurchaseResponse>>('/payments/purchase', {
      planId,
      paymentMethod: 'VNPAY',
    });
  },

  async getMySubscription(): Promise<ApiResponse<BackendResponse<UserSubscription>>> {
    return apiClient.get<BackendResponse<UserSubscription>>('/subscriptions/me');
  },

  async getRevenue(): Promise<ApiResponse<BackendResponse<PaymentRevenue>>> {
    return apiClient.get<BackendResponse<PaymentRevenue>>('/payments/revenue');
  },

  async verifyVNPayPayment(queryString: string): Promise<ApiResponse<BackendResponse<{ transactionNo: string; status: string; alreadyProcessed: boolean }>>> {
    return apiClient.get<BackendResponse<{ transactionNo: string; status: string; alreadyProcessed: boolean }>>(`/payments/vnpay-return${queryString}`);
  },
};

export default subscriptionService;
