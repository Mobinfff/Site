import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ClubCard } from '@/components/common/ClubCard'; // Import the actual ClubCard

// Placeholder data for featured clubs
// This should ideally match the ClubSummary type or the type expected by ClubCard
const featuredClubs = [
  { id: '1', name: 'باشگاه بدنسازی انرژی', location: 'تهران، ولیعصر', image: 'https://via.placeholder.com/300x200?text=Energy+Gym', rating: 4.5, sport_types: ['بدنسازی', 'TRX'] },
  { id: '2', name: 'باشگاه یوگا آرامش', location: 'اصفهان، مرداویج', image: 'https://via.placeholder.com/300x200?text=Aramesh+Yoga', rating: 4.8, sport_types: ['یوگا', 'پیلاتس'] },
  { id: '3', name: 'مجموعه ورزشی انقلاب', address: 'تهران، انقلاب', images: [{image_url:'https://via.placeholder.com/300x200?text=Enghelab+Complex'}], sport_types: [{id:1, name:'بدنسازی'}, {id:2, name:'شنا'}] },
];


export default function HomePage() {
  return (
    <div className="space-y-16 md:space-y-24">
      {/* Hero Section */}
      <section className="text-center py-12 md:py-20 bg-gradient-to-br from-primary-light via-primary to-primary-dark dark:from-gray-800 dark:via-gray-900 dark:to-black rounded-lg shadow-xl">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            باشگاه ورزشی ایده‌آل خود را <span className="text-yellow-300">کشف</span> و <span className="text-yellow-300">رزرو</span> کنید
          </h1>
          <p className="text-lg md:text-xl text-gray-200 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            فیت‌کلاب، سریع‌ترین و راحت‌ترین راه برای پیدا کردن و رزرو آنلاین بهترین باشگاه‌های ورزشی در نزدیکی شما.
          </p>
          <Button href="/clubs/search" variant="secondary" className="text-lg px-8 py-4 shadow-lg transform hover:scale-105">
            جستجوی باشگاه‌ها
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">چرا فیت‌کلاب؟</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow">
            {/* Icon Placeholder */}
            <div className="text-primary dark:text-primary-light text-5xl mb-4 mx-auto w-fit">🏋️</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">تنوع بی‌نظیر باشگاه‌ها</h3>
            <p className="text-gray-600 dark:text-gray-400">دسترسی به لیست کاملی از باشگاه‌های ورزشی با امکانات و رشته‌های متنوع.</p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow">
            {/* Icon Placeholder */}
            <div className="text-primary dark:text-primary-light text-5xl mb-4 mx-auto w-fit">📅</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">رزرو آنی و مطمئن</h3>
            <p className="text-gray-600 dark:text-gray-400">سانس دلخواه خود را به صورت آنلاین و در چند کلیک ساده رزرو کنید.</p>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow">
            {/* Icon Placeholder */}
            <div className="text-primary dark:text-primary-light text-5xl mb-4 mx-auto w-fit">💸</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">تخفیف‌ها و پیشنهادات ویژه</h3>
            <p className="text-gray-600 dark:text-gray-400">از تخفیف‌های ویژه باشگاه‌ها و پیشنهادات اختصاصی فیت‌کلاب بهره‌مند شوید.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">فیت‌کلاب چگونه کار می‌کند؟</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="p-4">
            <div className="text-secondary text-4xl font-bold mb-3">۱</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">جستجو کنید</h3>
            <p className="text-gray-600 dark:text-gray-400">باشگاه یا ورزش مورد نظر خود را بر اساس موقعیت، امکانات و قیمت جستجو کنید.</p>
          </div>
          <div className="p-4">
            <div className="text-secondary text-4xl font-bold mb-3">۲</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">انتخاب و بررسی کنید</h3>
            <p className="text-gray-600 dark:text-gray-400">اطلاعات کامل باشگاه، تصاویر، نظرات کاربران و سانس‌های موجود را مشاهده کنید.</p>
          </div>
          <div className="p-4">
            <div className="text-secondary text-4xl font-bold mb-3">۳</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">رزرو و پرداخت کنید</h3>
            <p className="text-gray-600 dark:text-gray-400">سانس خود را به صورت آنلاین رزرو و هزینه آن را با اطمینان پرداخت کنید.</p>
          </div>
        </div>
      </section>

      {/* Featured Clubs Section */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">باشگاه‌های پیشنهادی</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredClubs.map(club => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
        <div className="text-center mt-12">
          <Button href="/clubs/search" variant="primary" className="text-md">مشاهده همه باشگاه‌ها</Button>
        </div>
      </section>

      {/* Call to Action for Club Owners */}
      <section className="py-16 bg-primary-dark dark:bg-gray-800 text-white rounded-lg">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">صاحب باشگاه هستید؟</h2>
          <p className="text-lg text-gray-200 dark:text-gray-300 mb-8 max-w-xl mx-auto">
            باشگاه خود را در فیت‌کلاب ثبت کنید و به هزاران کاربر جدید دسترسی پیدا کنید. مدیریت سانس‌ها، فروش آنلاین و افزایش درآمد، همه در یک پلتفرم.
          </p>
          <Button href="/club-owner/register" variant="secondary" className="text-lg px-8 py-4 shadow-lg transform hover:scale-105">
            ثبت رایگان باشگاه
          </Button>
        </div>
      </section>
    </div>
  );
}
