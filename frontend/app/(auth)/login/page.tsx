'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/contexts/AuthContext';
import { requestOtpApi, verifyOtpApi } from '@/services/api'; // Assuming these are correctly exported
import Link from 'next/link';


export default function LoginPage() {
  const [step, setStep] = useState<'phoneNumber' | 'otp'>('phoneNumber'); // 'phoneNumber' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to dashboard or home based on role or preference
      // For now, redirecting to a generic dashboard path
      router.push('/dashboard'); // Adjust this path as needed
    }
  }, [isAuthenticated, user, router]);


  const handlePhoneNumberSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!phoneNumber.match(/^09[0-9]{9}$/)) {
      setError('شماره موبایل وارد شده صحیح نیست. (مثال: 09123456789)');
      return;
    }
    setLoading(true);
    try {
      await requestOtpApi(phoneNumber);
      setInfo(`کد تایید به شماره ${phoneNumber} ارسال شد.`);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'خطا در ارسال کد تایید.');
      console.error("Request OTP error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp.match(/^[0-9]{6}$/)) { // Assuming 6 digit OTP
      setError('کد تایید باید ۶ رقمی باشد.');
      return;
    }
    setLoading(true);
    try {
      const response = await verifyOtpApi(phoneNumber, otp);
      // Assuming response.data contains { access_token, refresh_token, user }
      const { access_token, refresh_token, user: userData } = response.data;
      if (access_token && refresh_token && userData) {
        login(access_token, refresh_token, userData); // This will set user and tokens in AuthContext
        // Redirection will be handled by useEffect or you can explicitly redirect here
        router.push('/dashboard'); // Or a more specific page like user.role === 'CLUB_OWNER' ? '/club-owner/dashboard' : '/user/dashboard'
      } else {
        throw new Error("اطلاعات ورود نامعتبر دریافت شد.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'خطا در تایید کد.');
      console.error("Verify OTP error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50 dark:bg-gray-900">
            <p className="text-lg text-gray-700 dark:text-gray-200">شما قبلا وارد شده‌اید. در حال انتقال به داشبورد...</p>
            {/* Optional: add a spinner here */}
        </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-10 px-4"> {/* Adjust min-h to account for navbar/footer */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
        <div className="text-center">
          <Link href="/" className="inline-block mb-6">
             <h1 className="text-3xl font-bold text-primary dark:text-primary-light">فیت‌کلاب</h1>
          </Link>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
            {step === 'phoneNumber' ? 'ورود یا ثبت‌نام' : 'کد تایید را وارد کنید'}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {step === 'phoneNumber'
              ? 'برای ورود یا ایجاد حساب کاربری، شماره موبایل خود را وارد کنید.'
              : `کد ۶ رقمی ارسال شده به شماره ${phoneNumber} را وارد نمایید.`}
          </p>
        </div>

        <Alert message={error} type="error" onClose={() => setError(null)} />
        <Alert message={info} type="info" onClose={() => setInfo(null)} />

        {step === 'phoneNumber' ? (
          <form onSubmit={handlePhoneNumberSubmit} className="space-y-6">
            <Input
              id="phone_number"
              name="phone_number"
              type="tel"
              label="شماره موبایل"
              placeholder="مثال: 09123456789"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
              required
              inputClassName="text-left ltr" // For phone number input style
              // iconLeft={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>}
            />
            <Button type="submit" className="w-full" loading={loading} disabled={loading}>
              {loading ? 'در حال ارسال...' : 'ارسال کد تایید'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <Input
              id="otp"
              name="otp"
              type="text" // Use "text" and pattern for better mobile experience with numeric keyboards
              inputMode="numeric" // Suggests numeric keyboard on mobile
              pattern="[0-9]*"    // Allows only numbers
              label="کد تایید"
              placeholder="کد ۶ رقمی"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading}
              required
              maxLength={6}
              inputClassName="text-center tracking-[0.5em]" // For OTP input style
            />
            <Button type="submit" className="w-full" loading={loading} disabled={loading}>
              {loading ? 'در حال بررسی...' : 'تایید و ورود'}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setStep('phoneNumber'); setError(null); setInfo(null); setOtp(''); }}
                className="text-sm text-primary dark:text-primary-light hover:underline disabled:opacity-50"
                disabled={loading}
              >
                ویرایش شماره موبایل
              </button>
            </div>
          </form>
        )}
        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          با ورود یا ثبت‌نام در فیت‌کلاب، با <Link href="/terms" className="font-medium text-primary dark:text-primary-light hover:underline">شرایط و قوانین</Link> و <Link href="/privacy" className="font-medium text-primary dark:text-primary-light hover:underline">سیاست حفظ حریم خصوصی</Link> ما موافقت می‌کنید.
        </p>
      </div>
    </div>
  );
}
