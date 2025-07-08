import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/Button'; // Assuming Button component exists
import { ClubSummary } from '@/services/clubService'; // Type for club data

// You might want to install an icon library like lucide-react or heroicons
// import { MapPin, Star, Zap } from 'lucide-react';

interface ClubCardProps {
  club: ClubSummary; // Use the interface from clubService or a more specific one for card
  className?: string;
}

const ClubCard: React.FC<ClubCardProps> = ({ club, className = '' }) => {
  const coverImage =
    club.images?.find(img => img.is_cover)?.image_url ||
    club.images?.[0]?.image_url ||
    `https://via.placeholder.com/400x250/E0E0E0/B0B0B0?text=${encodeURIComponent(club.name)}`; // Placeholder with better contrast

  return (
    <div
      className={`bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl group ${className}`}
    >
      <Link href={`/clubs/${club.id}`} className="block">
        <div className="relative">
          <img
            src={coverImage}
            alt={`تصویر باشگاه ${club.name}`}
            className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {/* Optional: Overlay for featured or new tag */}
          {/* {club.is_featured && (
            <span className="absolute top-3 right-3 bg-secondary text-white text-xs font-semibold px-2.5 py-1 rounded-full">ویژه</span>
          )} */}
        </div>
      </Link>
      <div className="p-5">
        <Link href={`/clubs/${club.id}`}>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1.5 truncate group-hover:text-primary dark:group-hover:text-primary-light transition-colors" title={club.name}>
            {club.name}
          </h3>
        </Link>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center" title={club.address}>
          {/* <MapPin size={16} className="ml-1.5 flex-shrink-0" /> */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-1.5 flex-shrink-0"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.145l.002-.001L10 18.43l.001.001.002.001.006.003.018.008a5.741 5.741 0 00.28-.145l.002-.001Zm2.305-1.487a.75.75 0 00-1.001-1.001l-.003.002-.003.002a.75.75 0 00-1.002-1.001l-.002.003-.002.003a.75.75 0 00-1.001-1.001L10 13.939l-1.004-1.004a.75.75 0 00-1.001 1.001l.002.003.002.003a.75.75 0 00-1.001 1.001l.003-.002.003-.002a.75.75 0 00-1.001 1.001l1.004 1.004L10 16.061l1.004 1.004a.75.75 0 001.001-1.001l-.003-.002-.002-.003Z" clipRule="evenodd" /><path d="M10 18a8 8 0 100-16 8 8 0 000 16ZM12 7a1 1 0 01-1 1H9a1 1 0 110-2h2a1 1 0 011 1Z" /></svg>
          <span className="truncate">{club.address}</span>
        </p>

        {/* <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center text-yellow-500 dark:text-yellow-400">
            <Star size={16} className="ml-1" />
            <span>{club.average_rating ? club.average_rating.toFixed(1) : 'جدید'}</span>
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {club.status === 'OPEN_NOW' ? <span className="text-green-600 dark:text-green-400">هم‌اکنون باز</span> : <span></span>}
          </div>
        </div> */}

        {club.sport_types && club.sport_types.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">رشته‌های ورزشی:</h4>
            <div className="flex flex-wrap gap-1.5">
              {club.sport_types.slice(0, 3).map((st) => ( // Show max 3 sport types initially
                <span key={st.id} className="text-xs bg-primary-light/20 dark:bg-primary-dark/30 text-primary dark:text-primary-light px-2 py-0.5 rounded-full">
                  {st.name}
                </span>
              ))}
              {club.sport_types.length > 3 && (
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                  +{club.sport_types.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        <Button href={`/clubs/${club.id}`} variant="outline" size="md" className="w-full mt-auto">
          {/* <Zap size={16} className="ml-2" /> */}
          مشاهده و رزرو
        </Button>
      </div>
    </div>
  );
};

export { ClubCard };
export type { ClubCardProps };
