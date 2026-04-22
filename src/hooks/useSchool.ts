import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { School } from '../types';
import { resolveSchoolId } from '../lib/resolveSchool';

export function useSchool() {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const schoolId = await resolveSchoolId();
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .eq('id', schoolId)
          .single();

        if (data && !error) {
          setSchool(data);
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
