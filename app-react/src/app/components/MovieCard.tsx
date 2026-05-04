import { Star } from 'lucide-react';

interface MovieCardProps {
  title: string;
  year: number;
  language: string;
  genres: string[];
  rating: number;
  synopsis: string;
}

export function MovieCard({ title, year, language, genres, rating, synopsis }: MovieCardProps) {
  const getRatingBadge = (rating: number) => {
    if (rating >= 8) return { label: 'Excellent', color: 'bg-green-600' };
    if (rating >= 6.5) return { label: 'Bon', color: 'bg-blue-600' };
    if (rating >= 5) return { label: 'Moyen', color: 'bg-orange-600' };
    return { label: 'Faible', color: 'bg-red-600' };
  };

  const badge = getRatingBadge(rating);
  const stars = Math.round(rating / 2);

  return (
    <div className="bg-[#1a1d2e] rounded-lg p-5 hover:ring-2 hover:ring-[#6366f1] transition-all">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-white flex-1">{title}</h3>
        <span className={`${badge.color} text-white px-2 py-1 rounded text-xs ml-2`}>
          {badge.label}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-gray-400 text-sm">{year}</span>
        <span className="bg-[#6366f1] text-white px-2 py-1 rounded text-xs uppercase">
          {language}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {genres.map((genre) => (
          <span key={genre} className="bg-[#2a2d3e] text-gray-300 px-2 py-1 rounded text-xs">
            {genre}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
          />
        ))}
        <span className="text-gray-400 text-sm ml-2">{rating.toFixed(1)}/10</span>
      </div>

      <p className="text-gray-400 text-sm line-clamp-2">{synopsis}</p>
    </div>
  );
}
