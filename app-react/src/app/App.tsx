import { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { MovieCard } from './components/MovieCard';

interface Movie {
  id: number;
  title: string;
  year: number;
  language: string;
  genres: string[];
  rating: number;
  synopsis: string;
  rating_band: string;
}

const ES_URL = 'http://localhost:9201';
const ES_INDEX = 'movies_clean';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState('all');
  const [genre, setGenre] = useState('all');
  const [year, setYear] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [total, setTotal] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const buildQuery = useCallback(() => {
    const must: object[] = [];
    const filter: object[] = [];

    if (searchTerm.trim() !== '') {
      must.push({
        multi_match: {
          query: searchTerm,
          fields: ['title^5', 'overview'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    } else {
      must.push({ match_all: {} });
    }

    if (language !== 'all') {
      filter.push({ term: { original_language: language } });
    }

    if (genre !== 'all') {
      filter.push({ term: { genres_list: genre } });
    }

    if (year === '2020+') {
      filter.push({ range: { release_year: { gte: 2020 } } });
    } else if (year === '2010-2019') {
      filter.push({ range: { release_year: { gte: 2010, lte: 2019 } } });
    } else if (year === '2000-2009') {
      filter.push({ range: { release_year: { gte: 2000, lte: 2009 } } });
    } else if (year === 'before-2000') {
      filter.push({ range: { release_year: { lt: 2000 } } });
    }

    return {
      track_total_hits: true,
      size: 24,
      query: {
        bool: { must, filter }
      },
      _source: [
        'id', 'title', 'release_year', 'original_language',
        'genres_list', 'vote_average', 'overview', 'rating_band'
      ]
    };
  }, [searchTerm, language, genre, year]);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const query = buildQuery();
      const response = await fetch(`${ES_URL}/${ES_INDEX}/_search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      if (!response.ok) throw new Error(`Erreur ES: ${response.status}`);

      const data = await response.json();
      const hits = data.hits.hits;
      const totalHits = data.hits.total.value;

      const results: Movie[] = hits.map((hit: any) => ({
        id: hit._source.id,
        title: hit._source.title || 'Titre inconnu',
        year: hit._source.release_year || 0,
        language: hit._source.original_language || '?',
        genres: hit._source.genres_list || [],
        rating: hit._source.vote_average || 0,
        synopsis: hit._source.overview || 'Aucun synopsis disponible.',
        rating_band: hit._source.rating_band || 'poor'
      }));

      setMovies(results);
      setTotal(totalHits);
    } catch (err: any) {
      setError('Impossible de contacter Elasticsearch. Vérifiez que la stack est lancée sur localhost:9201');
      setMovies([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [buildQuery]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <header className="text-center mb-8">
          <h1 className="text-white mb-2 text-3xl font-bold">🎬 Moteur de Recherche Films</h1>
          <p className="text-gray-400">Propulsé par Elasticsearch</p>
        </header>

        <div className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Rechercher par titre, synopsis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-[#1a1d2e] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
            />
            <button
              onClick={handleSearch}
              className="bg-[#6366f1] hover:bg-[#5558e3] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Search size={20} />
              Rechercher
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#1a1d2e] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
          >
            <option value="all">Toutes les langues</option>
            <option value="en">Anglais (en)</option>
            <option value="fr">Français (fr)</option>
            <option value="es">Espagnol (es)</option>
            <option value="ko">Coréen (ko)</option>
            <option value="ja">Japonais (ja)</option>
          </select>

          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="bg-[#1a1d2e] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
          >
            <option value="all">Tous les genres</option>
            <option value="Action">Action</option>
            <option value="Drama">Drame</option>
            <option value="Comedy">Comédie</option>
            <option value="Science Fiction">Science-Fiction</option>
            <option value="Horror">Horreur</option>
            <option value="Romance">Romance</option>
            <option value="Animation">Animation</option>
          </select>

          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="bg-[#1a1d2e] text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
          >
            <option value="all">Toutes les années</option>
            <option value="2020+">2020 et +</option>
            <option value="2010-2019">2010-2019</option>
            <option value="2000-2009">2000-2009</option>
            <option value="before-2000">Avant 2000</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
            ⚠️ {error}
          </div>
        )}

        {hasSearched && !isLoading && !error && (
          <div className="mb-6">
            <p className="text-gray-400">
              {total.toLocaleString()} résultat{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}
              {movies.length < total && ` — affichage des ${movies.length} premiers`}
            </p>
          </div>
        )}

        {!hasSearched ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">🔍 Lancez une recherche pour découvrir des films</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-[#6366f1]" size={48} />
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Aucun résultat trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {movies.map((movie, index) => (
              <MovieCard
                key={`${movie.id}-${index}`}
                title={movie.title}
                year={movie.year}
                language={movie.language}
                genres={movie.genres}
                rating={movie.rating}
                synopsis={movie.synopsis}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}