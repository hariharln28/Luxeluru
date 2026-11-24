import { Trophy, Star, Medal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import { salons } from '../data/salons';

export function LeaderboardPage() {
  const { staffReviews } = useApp();
  const tr = useT();

  const topSalons = [...salons]
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, 10);

  const staffMap = new Map<string, { name: string; salonName: string; salonId: string; avatar: string; rating: number; reviews: number }>();

  salons.forEach((salon) => {
    salon.staff.forEach((member) => {
      const reviews = staffReviews.filter((r) => r.staffId === member.id);
      const avgRating = reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : member.rating;
      staffMap.set(member.id, {
        name: member.name,
        salonName: salon.name,
        salonId: salon.id,
        avatar: member.avatar,
        rating: avgRating,
        reviews: member.reviewCount + reviews.length,
      });
    });
  });

  const allStylists = [...staffMap.values()]
    .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);

  // Deduplicate by name — keep only the highest-rated entry per name
  const seen = new Set<string>();
  const topStylists = allStylists.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  }).slice(0, 10);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl gold-gradient">{tr('leaderboard')}</h1>
      <p className="mt-2 text-[#9a8fa8]">Top-rated salons and stylists in Bengaluru — rated by real customers</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-display text-2xl text-[#e8d5a3]">
            <Trophy className="h-6 w-6 text-[#c9a962]" /> {tr('topSalons')}
          </h2>
          <div className="space-y-3">
            {topSalons.map((salon, idx) => (
              <Link
                key={salon.id}
                to={`/salons/${salon.id}`}
                className="luxe-card flex items-center gap-4 p-4 transition hover:border-[#c9a962]/40"
              >
                <span className="w-8 text-center text-lg">{idx < 3 ? medals[idx] : `#${idx + 1}`}</span>
                <img src={salon.image} alt={salon.name} className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#e8d5a3] truncate">{salon.name}</p>
                  <p className="text-xs text-[#9a8fa8]">{salon.area}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-[#c9a962] text-[#c9a962]" />
                    <span className="font-semibold">{salon.rating}</span>
                  </div>
                  <p className="text-xs text-[#9a8fa8]">{salon.reviewCount} {tr('reviews')}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 font-display text-2xl text-[#e8d5a3]">
            <Medal className="h-6 w-6 text-[#c9a962]" /> {tr('topStylists')}
          </h2>
          <div className="space-y-3">
            {topStylists.map((stylist, idx) => (
              <Link
                key={`${stylist.salonId}-${stylist.name}`}
                to={`/salons/${stylist.salonId}`}
                className="luxe-card flex items-center gap-4 p-4 transition hover:border-[#c9a962]/40"
              >
                <span className="w-8 text-center text-lg">{idx < 3 ? medals[idx] : `#${idx + 1}`}</span>
                <img src={stylist.avatar} alt={stylist.name} className="h-12 w-12 rounded-full bg-[#1a1520]" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#e8d5a3] truncate">{stylist.name}</p>
                  <p className="text-xs text-[#9a8fa8] truncate">{stylist.salonName}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-[#c9a962] text-[#c9a962]" />
                    <span className="font-semibold">{stylist.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-[#9a8fa8]">{stylist.reviews} {tr('reviews')}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
