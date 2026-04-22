import { supabase } from './supabase';

export type AuditAction =
  | 'result.publish'
  | 'result.unpublish'
  | 'student.add'
  | 'student.delete'
  | 'student.upload'
  | 'teacher.add'
  | 'teacher.delete'
  | 'timetable.generate'
  | 'timetable.clear'
  | 'results.upload'
  | 'results.enter'
  | 'attendance.mark'
  | 'school.update'
  | 'report.print';

export interface AuditDetails {
  [key: string]: string | number | boolean | null | undefined;
}

export async function logAction(
  action: AuditAction,
  details: AuditDetails = {},
  overrides: { school_id?: number; user_role?: string; user_name?: string; user_id?: string } = {}
) {
  try {
    const rawSchoolId = parseInt(localStorage.getItem('school_id') || '0') || null;
    const school_id = overrides.school_id ?? rawSchoolId;
    const user_role = overrides.user_role ?? localStorage.getItem('userRole') ?? 'unknown';
    const user_name = overrides.user_name ?? localStorage.getItem('userEmail') ?? null;
    const user_id = overrides.user_id ?? localStorage.getItem('teacherId') ?? null;

    await supabase.from('audit_logs').insert({
      school_id,
      user_role,
      user_name,
      user_id,
      action,
      details,
    });
  } catch {
  }
}
