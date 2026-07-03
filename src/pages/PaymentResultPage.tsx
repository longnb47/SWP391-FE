import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import subscriptionService from '../services/subscriptionService';

export const PaymentResultPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txnNo, setTxnNo] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      setIsLoading(true);
      setErrorMsg(null);

      // Parse amount from query params just for display purposes
      const params = new URLSearchParams(location.search);
      const vnpAmount = params.get('vnp_Amount');
      if (vnpAmount) {
        const numericAmount = parseFloat(vnpAmount) / 100;
        setAmount(new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numericAmount));
      }

      const vnpResponseCode = params.get('vnp_ResponseCode');
      const vnpTransactionStatus = params.get('vnp_TransactionStatus');

      // If VNPay response code is not '00', it's already a client-side failure
      if (vnpResponseCode && vnpResponseCode !== '00') {
        setIsSuccess(false);
        setErrorMsg(getVNPayErrorText(vnpResponseCode));
        setIsLoading(false);
        return;
      }
      if (vnpTransactionStatus && vnpTransactionStatus !== '00') {
        setIsSuccess(false);
        setErrorMsg('Transaction was canceled or failed.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await subscriptionService.verifyVNPayPayment(location.search);
        if (response.data && response.data.success) {
          const data = response.data.data;
          if (data.status === 'SUCCESS') {
            setIsSuccess(true);
            setTxnNo(data.transactionNo);
          } else {
            setIsSuccess(false);
            setErrorMsg(`Transaction status: ${data.status}`);
          }
        } else {
          setIsSuccess(false);
          setErrorMsg(response.error || 'Backend signature verification failed.');
        }
      } catch (err) {
        console.error('Error verifying payment:', err);
        setIsSuccess(false);
        setErrorMsg('An unexpected error occurred while verifying payment.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [location.search]);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 text-on-surface font-body-md select-none">
      <div className="w-full max-w-md bg-surface-container-low border border-outline-variant p-8 rounded-2xl shadow-lg animate-in zoom-in-95 duration-200 text-center">
        {isLoading ? (
          <div className="space-y-4 py-8">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
            </div>
            <div>
              <h2 className="font-title-lg text-title-lg font-bold">Verifying Payment</h2>
              <p className="text-secondary text-sm mt-1">Checking secure VNPay signature, please wait...</p>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="space-y-6">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-bounce">
              <span className="material-symbols-outlined text-[48px] icon-fill">check_circle</span>
            </div>

            <div>
              <h2 className="font-title-lg text-title-lg font-bold text-on-surface">Payment Successful!</h2>
              <p className="text-secondary text-sm mt-1">Thank you! Your premium subscription is now active.</p>
            </div>

            {/* Receipt details */}
            <div className="bg-surface-container border border-outline-variant/60 rounded-xl p-4 text-left text-sm space-y-2.5">
              <div className="flex justify-between">
                <span className="text-secondary font-medium">Status</span>
                <span className="text-primary font-bold">SUCCESS</span>
              </div>
              {amount && (
                <div className="flex justify-between">
                  <span className="text-secondary font-medium">Amount Paid</span>
                  <span className="font-bold text-on-surface">{amount}</span>
                </div>
              )}
              {txnNo && (
                <div className="flex flex-col space-y-0.5 pt-1.5 border-t border-outline-variant/40">
                  <span className="text-secondary text-xs font-medium">Transaction ID</span>
                  <span className="font-mono text-xs text-on-surface break-all">{txnNo}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-primary text-on-primary hover:bg-on-primary-fixed-variant rounded-xl font-semibold transition-all shadow-[0_2px_4px_rgba(160,65,0,0.2)] cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto text-error">
              <span className="material-symbols-outlined text-[48px]">cancel</span>
            </div>

            <div>
              <h2 className="font-title-lg text-title-lg font-bold text-on-surface">Payment Failed</h2>
              <p className="text-secondary text-sm mt-1">{errorMsg || 'We were unable to process your payment.'}</p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 bg-primary text-on-primary hover:bg-on-primary-fixed-variant rounded-xl font-semibold transition-all shadow-[0_2px_4px_rgba(160,65,0,0.2)] cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getVNPayErrorText = (code: string) => {
  switch (code) {
    case '01': return 'Transaction already exists.';
    case '02': return 'Merchant configuration error.';
    case '04': return 'Transaction suspended.';
    case '05': return 'Incorrect password limit exceeded.';
    case '06': return 'OTP verification limit exceeded.';
    case '07': return 'Incorrect password limit exceeded.';
    case '09': return 'Transaction declined by bank.';
    case '10': return 'Invalid billing details.';
    case '11': return 'Timeout processing payment.';
    case '12': return 'Card status is blocked or inactive.';
    case '13': return 'Incorrect OTP entered.';
    case '24': return 'Transaction canceled by customer.';
    case '51': return 'Insufficient funds in account.';
    case '65': return 'Daily transfer limit exceeded.';
    case '75': return 'Emergency maintenance. Bank server down.';
    case '79': return 'Unknown card processing error.';
    default: return 'Transaction failed (VNPAY Code ' + code + ').';
  }
};

export default PaymentResultPage;
