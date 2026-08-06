import { useEffect, useState } from "react";
import { getCategories } from "@/services/category.service";
import type { CategoryList } from "@/types/category";

export function useCategories() {
  const [data, setData] = useState<CategoryList[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);

    try {
      const categories = await getCategories();
      setData(categories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return {
    data,
    loading,
    reload: load,
  };
}
