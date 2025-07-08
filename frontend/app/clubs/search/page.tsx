'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
// ClubCard will be moved and imported from its new location in the next step
// For now, let's copy its definition here temporarily or assume it's available globally for this step
// To avoid error, I'll define a very simple placeholder here, then replace it
import { ClubCard } from '@/components/common/ClubCard'; // Import the actual ClubCard
import { getPublicClubsApi, ClubSummary } from '@/services/clubService'; // Import from clubService
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';


export default function ClubSearchPage() {
  const [clubs, setClubs] = useState<ClubSummary[]>([]); // Use ClubSummary type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // TODO: Add states for other filters like location, sport_type, facilities, etc.
  // TODO: Add pagination state (currentPage, totalPages)

  const fetchClubs = useCallback(async (nameQuery?: string) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedClubs = await getPublicClubsApi({
        name: nameQuery && nameQuery.trim() !== '' ? nameQuery.trim() : undefined,
        // limit: 10,
        // page: currentPage
      });
      setClubs(fetchedClubs);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'خطا در دریافت لیست باشگاه‌ها.');
      console.error("Fetch clubs error:", err);
      setClubs([]); // Clear clubs on error
    } finally {
      setLoading(false);
    }
  }, []); // Add dependencies like currentPage if pagination is added

  useEffect(() => {
    fetchClubs(); // Initial fetch
  }, [fetchClubs]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchClubs(searchTerm);
  };

  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Optional: Debounce search or search on blur/submit only
    // For now, search on submit
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-8 text-center">
        جستجوی باشگاه‌های ورزشی
      </h1>

      {/* Filters Section */}
      <div className="mb-10 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
          <Input
            label="نام باشگاه"
            id="search-term"
            placeholder="مثلا: انرژی، آفتاب، ..."
            value={searchTerm}
            onChange={handleSearchTermChange}
            containerClassName="md:col-span-2 lg:col-span-3"
          />
          {/* TODO: Add more filters: location (city, neighborhood), sport type, facilities, price range etc. */}
          {/* Example:
          <Input label="شهر" id="city" placeholder="مثلا: تهران" />
          <Select label="نوع ورزش" id="sport-type"> <options...> </Select>
          */}
          <Button type="submit" className="w-full h-[46px]" loading={loading}>
            جستجو
          </Button>
        </form>
      </div>

      {/* Results Section */}
      {loading && (
        <div className="text-center py-10">
          {/* Simple Spinner */}
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary dark:border-primary-light"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">در حال بارگذاری باشگاه‌ها...</p>
        </div>
      )}

      {error && !loading && (
         <Alert message={error} type="error" onClose={() => setError(null)} />
      )}

      {!loading && !error && clubs.length === 0 && (
        <div className="text-center py-10">
          <p className="text-xl text-gray-500 dark:text-gray-400">
            باشگاهی با معیارهای جستجوی شما یافت نشد.
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            سعی کنید فیلترهای خود را تغییر دهید یا عبارت جستجو را اصلاح کنید.
          </p>
        </div>
      )}

      {!loading && !error && clubs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}

      {/* TODO: Add Pagination controls here if API supports it */}
      {/* <div className="mt-12 flex justify-center">
        <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>قبلی</Button>
        <span className="mx-4 p-2">صفحه {currentPage} از {totalPages}</span>
        <Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>بعدی</Button>
      </div> */}
    </div>
  );
}
