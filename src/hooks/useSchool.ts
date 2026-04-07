import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { School } from '../types';

export function useSchool() {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchool = async () => {
      const schoolId = localStorage.getItem('school_id') || '1';
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .eq('id', schoolId)
          .single();

        if (data) {
          setSchool(data);
          // Apply theme colors if available
          if (data.primary_color) {
            document.documentElement.style.setProperty('--primary-color', data.primary_color);
          }
          if (data.secondary_color) {
            document.documentElement.style.setProperty('--secondary-color', data.secondary_color);
          }
        }
      } catch (error) {
        console.error('Error fetching school info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, []);

  return { school, loading };
}
