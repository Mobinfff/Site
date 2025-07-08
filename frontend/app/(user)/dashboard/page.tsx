'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getMyProfileApi } from '@/services/api'; // Assuming getMyProfileApi is in api.ts or a userService.ts
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';

// Define interface for bookings (should match backend Booking entity)
interface BookingSummary {
  id: string;
  booking_date: string;
  status: string; // e.g., PENDING_PAYMENT, CONFIRMED, CANCELLED_BY_USER
  total_price: number;
  schedule: {
    id: string;
    name?: string;
    start_time: string;
    end_time: string;
    club: {
      id: string;
      name: string;
    };
    sport_type?: {
        name: string;
    }
  };
  // Add other relevant fields from your Booking entity
}

// Define interface for user profile data (if different from AuthContext's user)
// For now, we'll use AuthContext's user and potentially refresh it.
// interface UserProfile extends User { // from AuthContext
//   // any additional fields from /users/me not in basic User
// }


export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading, logout, fetchUserProfile } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  // const [profileData, setProfileData] = useState<UserProfile | null>(user); // Can sync with user from AuthContext

  // Route Guarding
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/dashboard'); // Redirect to login if not authenticated
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch latest profile data (optional, if AuthContext user might be stale)
  // useEffect(() => {
  //   if (isAuthenticated && !user) { // Or if you want to refresh always
  //     fetchUserProfile().then(updatedUser => {
  //       if (updatedUser) setProfileData(updatedUser);
  //     });
  //   } else if (user) {
  //     setProfileData(user);
  //   }
  // }, [isAuthenticated, user, fetchUserProfile]);

  const fetchMyBookings = useCallback(async () => {
    if (!isAuthenticated) return;
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      // Assuming an API function exists: getMyBookingsApi() in services/api.ts or bookingsService.ts
      // For now, using a direct api.get call as an example
      const response = await getMyProfileApi().then(profileRes => { // Chaining for example, better in separate calls
          if(profileRes.data) { // Update user in context potentially
            // login(getAccessToken()!, getRefreshToken()!, profileRes.data) // Risky if tokens are not fresh
          }
          return api.get('/bookings/my-bookings'); // Replace with actual bookings API call
      });

      // const response = await api.get('/bookings/my-bookings'); // Direct call
      setBookings(response.data || []); // Adjust if response is paginated e.g. response.data.data
    } catch (err: any) {
      setBookingsError(err.response?.data?.message || err.message || 'خطا در دریافت لیست رزروها.');
      console.error("Fetch my bookings error:", err);
    } finally {
      setBookingsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);


  if (authLoading || !isAuthenticated) {
    // Show a loading spinner or a blank page while checking auth / redirecting
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary dark:border-primary-light"></div>
      </div>
    );
  }

  // At this point, user is authenticated.
  // `user` from useAuth() should be available.

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
          داشبورد کاربری
        </h1>
        <Button onClick={logout} variant="danger" size="sm" className="mt-4 md:mt-0">
          خروج از حساب
        </Button>
      </div>

      {/* Profile Section */}
      <section className="mb-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">اطلاعات پروفایل</h2>
        {user ? (
          <div className="space-y-3 text-gray-600 dark:text-gray-300">
            <p><strong>نام:</strong> {user.first_name || 'ثبت نشده'}</p>
            <p><strong>نام خانوادگی:</strong> {user.last_name || 'ثبت نشده'}</p>
            <p><strong>شماره موبایل:</strong> {user.phone_number}</p>
            <p><strong>ایمیل:</strong> {user.email || 'ثبت نشده'}</p>
            <p><strong>نقش:</strong> {user.role}</p> {/* TODO: Translate role */}
            <Button href="/profile/edit" variant='outline' size='sm' className="mt-2">ویرایش پروفایل</Button>
          </div>
        ) : (
          <p>در حال بارگذاری اطلاعات پروفایل...</p>
        )}
      </section>

      {/* Bookings Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-6">رزروهای من</h2>
        {bookingsLoading && (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary dark:border-primary-light"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">در حال بارگذاری رزروها...</p>
          </div>
        )}
        {bookingsError && !bookingsLoading && (
          <Alert message={bookingsError} type="error" onClose={() => setBookingsError(null)} />
        )}
        {!bookingsLoading && !bookingsError && bookings.length === 0 && (
          <div className="p-6 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">شما تاکنون هیچ رزروی انجام نداده‌اید.</p>
            <Button href="/clubs/search" variant="primary" className="mt-4">جستجوی باشگاه و رزرو</Button>
          </div>
        )}
        {!bookingsLoading && !bookingsError && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-primary dark:text-primary-light">
                            {booking.schedule.club.name} - {booking.schedule.sport_type?.name || booking.schedule.name || 'سانس عمومی'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            تاریخ: {new Date(booking.booking_date).toLocaleDateString('fa-IR')} |
                            ساعت: {booking.schedule.start_time.substring(0,5)} - {booking.schedule.end_time.substring(0,5)}
                        </p>
                    </div>
                    <div className="mt-2 sm:mt-0 text-sm">
                        <p>وضعیت: <span className={`font-semibold px-2 py-0.5 rounded-full text-xs
                            ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
                              booking.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100' :
                              booking.status.includes('CANCELLED') ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'}`}>
                            {booking.status} {/* TODO: Translate status */}
                        </span></p>
                        <p className="mt-1">مبلغ: {booking.total_price.toLocaleString('fa-IR')} تومان</p>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex space-x-2 space-x-reverse">
                    <Button href={`/bookings/${booking.id}`} variant="outline" size="sm">مشاهده جزئیات</Button>
                    {booking.status === 'CONFIRMED' && ( /* Or PENDING_PAYMENT if cancellable before payment */
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={async () => {
                                if(confirm('آیا از لغو این رزرو مطمئن هستید؟')) {
                                    try {
                                        // TODO: Call cancel booking API
                                        // await api.patch(`/bookings/${booking.id}/cancel-by-user`);
                                        alert('درخواست لغو رزرو (در حال حاضر شبیه‌سازی شده). نیاز به پیاده‌سازی API لغو.');
                                        fetchMyBookings(); // Refresh list
                                    } catch (cancelErr) {
                                        alert('خطا در لغو رزرو.');
                                    }
                                }
                            }}
                        >
                            لغو رزرو
                        </Button>
                    )}
                     {booking.status === 'PENDING_PAYMENT' && (
                        <Button
                            href={`/payment/initiate?booking_id=${booking.id}`} /* Needs a proper payment initiation page */
                            variant="primary"
                            size="sm"
                        >
                            پرداخت
                        </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
