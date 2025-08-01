import { useState, useEffect } from 'react';
import { CACHE_CONFIG } from '@/lib/constants';

interface CategoryData {
  id: string;
  name: string;
  color: string;
  description: string;
}

interface UseCategoryBySlugReturn {
  category: CategoryData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Simple cache for category data (avoid repeated API calls)
const categoryCache = new Map<string, { data: CategoryData; timestamp: number }>();
const CACHE_TTL = CACHE_CONFIG.TTL.CATEGORIES;

export function useCategoryBySlug(slug: string): UseCategoryBySlugReturn {
  const [category, setCategory] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = categoryCache.get(slug);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        setCategory(cached.data);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/categories/slug/${slug}`);
      
      if (res.ok) {
        const data = await res.json();
        
        // Update cache
        categoryCache.set(slug, { data, timestamp: Date.now() });
        
        setCategory(data);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "Categoria não encontrada");
      }
    } catch (fetchError) {
      console.error('Erro ao carregar categoria:', fetchError);
      setError("Erro ao carregar categoria");
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    // Clear cache for this slug
    categoryCache.delete(slug);
    fetchCategory();
  };

  useEffect(() => {
    if (slug) {
      fetchCategory();
    }
  }, [slug]);

  return { category, loading, error, refetch };
}