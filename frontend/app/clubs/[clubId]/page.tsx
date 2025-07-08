'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation'; // To get clubId from route
import { getPublicClubDetailsApi, ClubSummary } from '@/services/clubService'; // Use ClubSummary or a more detailed ClubDetail type
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
// import ImageGallery from '@/components/common/ImageGallery'; // Placeholder for a gallery component
// import ScheduleList from '@/components/common/ScheduleList'; // Placeholder for schedule list

// Define a more detailed interface if needed, extending ClubSummary
interface ClubDetail extends ClubSummary {
  description?: string;
  phone_number?: string;
  email?: string;
  website?: string;
  // schedules would be a more complex type:
  schedules?: Array<{
    id: string;
    name?: string;
    start_time: string;
    end_time: string;
    days_of_week: (number[] | string[]);
    price: number;
    capacity: number;
    current_occupancy: number;
    schedule_status: string; // OPEN, CLOSED, FULL, CANCELLED
    sport_type?: { id: number; name: string };
  }>;
  // Add other detailed fields like full facility objects, reviews etc.
}

// Simple Image Gallery Placeholder
const ImageGalleryPlaceholder: React.FC<{ images?: Array<{ image_url: string; alt_text?: string }> }> = ({ images }) => {
  if (!images || images.length === 0) {
    return <img src={`https://via.placeholder.com/800x400/E0E0E0/B0B0B0?text=No+Image`} alt="No image available" className="w-full h-64 md:h-96 object-cover rounded-lg shadow-md" />;
  }
  // For now, just show the first image or cover image. A real gallery would have thumbnails, lightbox etc.
  const mainImage = images.find(img => (img as any).is_cover)?.image_url || images[0].image_url;
  return (
    <div className="mb-8">
      <img src={mainImage} alt={images[0].alt_text || "Club image"} className="w-full max-h-[500px] object-cover rounded-lg shadow-lg" />
      {/* TODO: Add thumbnails or a carousel for multiple images */}
    </div>
  );
};

// Simple Schedule List Placeholder
const ScheduleListPlaceholder: React.FC<{ schedules?: ClubDetail['schedules'] }> = ({ schedules }) => {
  if (!schedules || schedules.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400">در حال حاضر هیچ سانسی برای این باشگاه تعریف نشده است.</p>;
  }
  return (
    <div className="space-y-4">
      {schedules.map(schedule => (
        <div key={schedule.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <h4 className="font-semibold text-lg text-primary dark:text-primary-light">
            {schedule.name || `سانس ${schedule.sport_type?.name || ''} (${schedule.start_time} - ${schedule.end_time})`}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            روزها: {Array.isArray(schedule.days_of_week) ? schedule.days_of_week.join(', ') : schedule.days_of_week}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">ظرفیت: {schedule.current_occupancy} / {schedule.capacity} نفر</p>
          <p className="text-sm font-bold text-green-600 dark:text-green-400">{schedule.price.toLocaleString('fa-IR')} تومان</p>
          <p className={`text-xs font-semibold ${schedule.schedule_status === 'OPEN' ? 'text-green-500' : 'text-red-500'}`}>
            وضعیت: {schedule.schedule_status} {/* TODO: Translate status */}
          </p>
          {schedule.schedule_status === 'OPEN' && (
             <Button size="sm" className="mt-3">رزرو این سانس</Button> // TODO: Link to booking process
          )}
        </div>
      ))}
    </div>
  );
};


export default function ClubDetailPage() {
  const params = useParams();
  const clubId = params.clubId as string; // Get clubId from route parameters

  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClubDetails = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // The backend's /clubs/:id endpoint should return all necessary details including schedules, facilities, sport_types, images.
      // Ensure the ClubDetail interface matches this response structure.
      const fetchedClub = await getPublicClubDetailsApi(id);
      setClub(fetchedClub as ClubDetail); // Cast if getPublicClubDetailsApi returns ClubSummary
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'خطا در دریافت اطلاعات باشگاه.');
      console.error(`Fetch club details error for ID ${id}:`, err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clubId) {
      fetchClubDetails(clubId);
    }
  }, [clubId, fetchClubDetails]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-20rem)]">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary dark:border-primary-light"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <Alert message={error} type="error" />
        <Button href="/clubs/search" className="mt-6">بازگشت به لیست باشگاه‌ها</Button>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <p className="text-xl text-gray-500 dark:text-gray-400">باشگاه مورد نظر یافت نشد.</p>
        <Button href="/clubs/search" className="mt-6">بازگشت به لیست باشگاه‌ها</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-2 md:px-0">
      {/* Header: Name & Address */}
      <div className="mb-8 text-center md:text-right">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2">{club.name}</h1>
        <p className="text-md md:text-lg text-gray-600 dark:text-gray-400">{club.address}</p>
        {/* TODO: Add breadcrumbs */}
      </div>

      {/* Image Gallery */}
      <ImageGalleryPlaceholder images={club.images} />

      {/* Main Content Area (Two Columns on Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Left Column (Main Info & Schedules) */}
        <div className="md:col-span-2 space-y-8">
          {/* Description */}
          {club.description && (
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 border-b-2 border-primary dark:border-primary-light pb-2">توضیحات باشگاه</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {club.description}
              </p>
            </section>
          )}

          {/* Schedules */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 border-b-2 border-primary dark:border-primary-light pb-2">سانس‌های موجود</h2>
            <ScheduleListPlaceholder schedules={club.schedules} />
          </section>
        </div>

        {/* Right Column (Sidebar: Contact, Facilities, Sport Types, Map) */}
        <aside className="md:col-span-1 space-y-8">
          {/* Contact Info */}
          {(club.phone_number || club.email || club.website) && (
            <section className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">اطلاعات تماس</h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {club.phone_number && <p><strong>تلفن:</strong> <a href={`tel:${club.phone_number}`} className="hover:text-primary ltr inline-block">{club.phone_number}</a></p>}
                {club.email && <p><strong>ایمیل:</strong> <a href={`mailto:${club.email}`} className="hover:text-primary">{club.email}</a></p>}
                {club.website && <p><strong>وب‌سایت:</strong> <a href={club.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary text-blue-500 dark:text-blue-400">{club.website}</a></p>}
              </div>
            </section>
          )}

          {/* Facilities */}
          {club.facilities && club.facilities.length > 0 && (
            <section className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">امکانات باشگاه</h3>
              <ul className="space-y-1.5 text-sm">
                {club.facilities.map(facility => (
                  <li key={facility.id} className="flex items-center text-gray-700 dark:text-gray-300">
                    {/* Placeholder for facility icon */}
                    <span className="text-green-500 mr-2">✓</span>
                    {facility.name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Sport Types */}
          {club.sport_types && club.sport_types.length > 0 && (
            <section className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">رشته‌های ورزشی</h3>
              <div className="flex flex-wrap gap-2">
                {club.sport_types.map(sport => (
                  <span key={sport.id} className="bg-primary-light/20 dark:bg-primary-dark/30 text-primary dark:text-primary-light text-xs font-medium px-2.5 py-1 rounded-full">
                    {sport.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* TODO: Map Placeholder */}
          {/* {club.latitude && club.longitude && (
            <section className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">موقعیت مکانی</h3>
              <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded flex items-center justify-center text-gray-500">
                نقشه اینجا قرار می‌گیرد (نیاز به کتابخانه نقشه)
              </div>
            </section>
          )} */}
        </aside>
      </div>
      {/* TODO: Reviews Section */}
    </div>
  );
}
