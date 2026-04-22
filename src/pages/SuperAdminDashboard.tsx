import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Settings, 
  Bell, 
  Search,
  LayoutDashboard,
  GraduationCap,
  TrendingUp,
  BarChart3,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Filter,
  LogOut,
  ShieldCheck,
  Building2,
  ClipboardList,
  Layers,
  ArrowRight,
  RefreshCw,
  UserCheck,
  ExternalLink,
  Copy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { School, AssessmentTemplate, TemplateSubject, TemplateTask } from '../types';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

type Tab = 'overview' | 'schools' | 'admins' | 'templates' | 'system-logs';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [schools, setSchools] = useState<School[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // School Form State
  const [newSchool, setNewSchool] = useState({ name: '', slug: '', domain: '', primary_color: '#059669', secondary_color: '#10b981' });
  const [editingSlug, setEditingSlug] = useState<{ id: number; slug: string } | null>(null);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  // Admin Form State
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', school_id: '' });

  // Template Form State
  const [newTemplate, setNewTemplate] = useState({ name: '', grade_level: '', term: 'Term 1' });
  const [selectedTemplate, setSelectedTemplate] = useState<AssessmentTemplate | null>(null);
  const [templateSubjects, setTemplateSubjects] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState({ name: '', code: '' });
  const [newTasks, setNewTasks] = useState<any[]>([]);
  const [assigningTo, setAssigningTo] = useState<number[]>([]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsFilter, setLogsFilter] = useState({ school_id: '', action: '', from: '', to: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'system-logs') fetchAuditLogs();
  }, [activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [schoolsRes, templatesRes, adminsRes] = await Promise.all([
        supabase.from('schools').select('*').order('name'),
        supabase.from('assessment_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('admins').select('*, schools(name)')
      ]);

      if (schoolsRes.data) setSchools(schoolsRes.data);
      if (templatesRes.data) setTemplates(templatesRes.data);
      if (adminsRes.data) setAdmins(adminsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchAuditLogs = async (filter = logsFilter) => {
    setLogsLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (filter.school_id) query = query.eq('school_id', parseInt(filter.school_id));
      if (filter.action) query = query.eq('action', filter.action);
      if (filter.from) query = query.gte('created_at', filter.from);
      if (filter.to) query = query.lte('created_at', filter.to + 'T23:59:59Z');
      const { data } = await query;
      setAuditLogs(data || []);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    const slugValue = newSchool.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') || null;
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert([{ ...newSchool, slug: slugValue }])
        .select();

      if (error) throw error;
      setSchools([...schools, data[0]]);
      setNewSchool({ name: '', slug: '', domain: '', primary_color: '#059669', secondary_color: '#10b981' });
      showMessage('success', 'School added successfully');
    } catch (error: any) {
      showMessage('error', error.message);
    }
  };

  const handleSaveSlug = async () => {
    if (!editingSlug) return;
    const slug = editingSlug.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    try {
      const { error } = await supabase.from('schools').update({ slug }).eq('id', editingSlug.id);
      if (error) throw error;
      setSchools(schools.map(s => s.id === editingSlug.id ? { ...s, slug } : s));
      setEditingSlug(null);
      showMessage('success', 'Subdomain slug saved');
    } catch (error: any) {
      showMessage('error', error.message);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.school_id) {
      showMessage('error', 'Please select a school');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('admins')
        .insert([newAdmin])
        .select('*, schools(name)');

      if (error) throw error;
      setAdmins([...admins, data[0]]);
      setNewAdmin({ email: '', password: '', school_id: '' });
      showMessage('success', 'Admin added successfully');
    } catch (error: any) {
      showMessage('error', error.message);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('assessment_templates')
        .insert([newTemplate])
        .select();

      if (error) throw error;
      setTemplates([data[0], ...templates]);
      setNewTemplate({ name: '', grade_level: '', term: 'Term 1' });
      showMessage('success', 'Template created successfully');
    } catch (error: any) {
      showMessage('error', error.message);
    }
  };

  const handleAssignTemplate = async (templateId: number, schoolIds: number[]) => {
    setLoading(true);
    try {
      // 1. Fetch template structure
      const { data: subjects } = await supabase
        .from('template_subjects')
        .select('*, template_tasks(*)')
        .eq('template_id', templateId);

      if (!subjects) return;

      for (const schoolId of schoolIds) {
        for (const sub of subjects) {
          // 2. Create subject for school
          const { data: schoolSub } = await supabase
            .from('subjects')
            .insert([{ 
              name: sub.subject_name, 
              code: sub.subject_code, 
              school_id: schoolId 
            }])
            .select()
            .single();

          if (schoolSub) {
            // 3. Create tasks for school
            const tasksToCreate = sub.template_tasks.map((t: any) => ({
              subject_id: schoolSub.id,
              name: t.task_name,
              total_marks: t.max_marks,
              weighting: t.weighting,
              term: templates.find(temp => temp.id === templateId)?.term || 'Term 1',
              year: new Date().getFullYear(),
              school_id: schoolId
            }));

            await supabase.from('tasks').insert(tasksToCreate);
          }
        }
      }
      showMessage('success', 'Template assigned to schools successfully');
    } catch (error: any) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = (schoolId: number) => {
    localStorage.setItem('school_id', schoolId.toString());
    localStorage.setItem('userRole', 'admin');
    navigate('/admin');
  };

  const copyDemoLink = (school: School) => {
    const slug = school.slug;
    const url = slug
      ? `${window.location.origin}/?slug=${slug}`
      : `${window.location.origin}/?school_id=${school.id}`;
    navigator.clipboard.writeText(url);
    showMessage('success', slug ? `Link copied: ?slug=${slug}` : 'Demo link copied (no slug set)');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Super Admin</h1>
              <p className="text-xs text-slate-500 font-medium">System Control</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'schools', label: 'Schools', icon: Building2 },
              { id: 'admins', label: 'School Admins', icon: UserCheck },
              { id: 'templates', label: 'Templates', icon: ClipboardList },
              { id: 'system-logs', label: 'System Logs', icon: Clock },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${
                  activeTab === item.id 
                    ? 'bg-primary-600 text-white shadow-xl shadow-primary-600/20' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-4 text-red-600 hover:bg-red-50 rounded-2xl font-bold transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 capitalize">{activeTab.replace('-', ' ')}</h2>
            <p className="text-slate-500 mt-1">Manage your multi-school ecosystem</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-primary-600 transition-all shadow-sm">
              <Bell className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">System Admin</p>
                <p className="text-xs text-slate-500">ndhlovuoupa1@gmail.com</p>
              </div>
              <div className="w-12 h-12 bg-slate-200 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                <img src="https://i.pravatar.cc/150?u=superadmin" alt="Admin" />
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { label: 'Total Schools', value: schools.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Templates', value: templates.length, icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'School Admins', value: admins.length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color} mb-6`}>
                      <stat.icon className="w-7 h-7" />
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{stat.label}</p>
                    <h3 className="text-4xl font-bold text-slate-900 mt-2">{stat.value}</h3>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
                >
                  <h3 className="text-xl font-bold text-slate-900 mb-8">Ecosystem Growth</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Jan', schools: 2 },
                        { name: 'Feb', schools: 5 },
                        { name: 'Mar', schools: schools.length },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="schools" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
                >
                  <h3 className="text-xl font-bold text-slate-900 mb-8">Admin Distribution</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Active Admins', value: admins.length },
                            { name: 'Pending', value: 2 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#f1f5f9" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'schools' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Add New School</h3>
                <form onSubmit={handleAddSchool} className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">School Name</label>
                    <input 
                      type="text" 
                      required
                      value={newSchool.name}
                      onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500" 
                      placeholder="e.g. Sunrise Primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Subdomain Slug</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={newSchool.slug}
                        onChange={(e) => setNewSchool({ ...newSchool, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 font-mono text-sm" 
                        placeholder="sunrise"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Used for: sunrise.yourdomain.co.za</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Domain (Optional)</label>
                    <input 
                      type="text" 
                      value={newSchool.domain}
                      onChange={(e) => setNewSchool({ ...newSchool, domain: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500" 
                      placeholder="sunrise.edu"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Theme Color</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={newSchool.primary_color}
                        onChange={(e) => setNewSchool({ ...newSchool, primary_color: e.target.value })}
                        className="h-14 w-14 p-1 bg-white border border-slate-100 rounded-2xl cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={newSchool.primary_color}
                        onChange={(e) => setNewSchool({ ...newSchool, primary_color: e.target.value })}
                        className="flex-1 px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20">
                      Create School
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">School Name</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Subdomain Slug</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Domain</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schools.map((school) => (
                      <tr key={school.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 font-bold">
                              {school.name[0]}
                            </div>
                            <span className="font-bold text-slate-900">{school.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {editingSlug?.id === school.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingSlug.slug}
                                onChange={(e) => setEditingSlug({ ...editingSlug, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm w-32 focus:ring-2 focus:ring-primary-400 outline-none"
                                autoFocus
                              />
                              <button onClick={handleSaveSlug} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition-all">Save</button>
                              <button onClick={() => setEditingSlug(null)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {school.slug ? (
                                <span className="font-mono text-sm bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg">{school.slug}</span>
                              ) : (
                                <span className="text-slate-400 italic text-sm">not set</span>
                              )}
                              <button onClick={() => setEditingSlug({ id: school.id, slug: school.slug || '' })} className="p-1 text-slate-300 hover:text-primary-600 transition-colors" title="Edit slug">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-6 text-slate-500">{school.domain || '—'}</td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => copyDemoLink(school)}
                              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                              title={school.slug ? `Copy ?slug=${school.slug} link` : 'Copy demo link'}
                            >
                              <Copy className="w-5 h-5" />
                            </button>
                            <a 
                              href={school.slug ? `/?slug=${school.slug}` : `/?school_id=${school.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                              title="Open Demo Landing"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                            <button 
                              onClick={() => handleImpersonate(school.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl font-bold text-sm hover:bg-primary-600 hover:text-white transition-all"
                            >
                              Manage <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'admins' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Add School Admin</h3>
                <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500" 
                      placeholder="admin@school.edu"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Password</label>
                    <input 
                      type="password" 
                      required
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500" 
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Assign to School</label>
                    <select 
                      required
                      value={newAdmin.school_id}
                      onChange={(e) => setNewAdmin({ ...newAdmin, school_id: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select School</option>
                      {schools.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20">
                      Create Admin
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Admin Email</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest">School</th>
                      <th className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6 font-bold text-slate-900">{admin.email}</td>
                        <td className="px-8 py-6 text-slate-500">{admin.schools?.name || 'Unknown'}</td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'system-logs' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-end gap-4 mb-6">
                  <div className="flex-1 min-w-[180px] space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">School</label>
                    <select
                      value={logsFilter.school_id}
                      onChange={(e) => setLogsFilter({ ...logsFilter, school_id: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">All Schools</option>
                      {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 min-w-[180px] space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Action Type</label>
                    <select
                      value={logsFilter.action}
                      onChange={(e) => setLogsFilter({ ...logsFilter, action: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">All Actions</option>
                      <option value="result.publish">Results Published</option>
                      <option value="result.unpublish">Results Unpublished</option>
                      <option value="student.add">Student Added</option>
                      <option value="student.delete">Student Deleted</option>
                      <option value="student.upload">Students Uploaded</option>
                      <option value="teacher.add">Teacher Added</option>
                      <option value="teacher.delete">Teacher Deleted</option>
                      <option value="timetable.generate">Timetable Generated</option>
                      <option value="timetable.clear">Timetable Cleared</option>
                      <option value="results.upload">Results Uploaded</option>
                      <option value="attendance.mark">Attendance Marked</option>
                      <option value="report.print">Report Printed</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[140px] space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">From</label>
                    <input
                      type="date"
                      value={logsFilter.from}
                      onChange={(e) => setLogsFilter({ ...logsFilter, from: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex-1 min-w-[140px] space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">To</label>
                    <input
                      type="date"
                      value={logsFilter.to}
                      onChange={(e) => setLogsFilter({ ...logsFilter, to: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button
                    onClick={() => fetchAuditLogs(logsFilter)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold text-sm hover:bg-primary-700 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" /> Search
                  </button>
                  <button
                    onClick={() => {
                      const reset = { school_id: '', action: '', from: '', to: '' };
                      setLogsFilter(reset);
                      fetchAuditLogs(reset);
                    }}
                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-500">{logsLoading ? 'Loading…' : `${auditLogs.length} event${auditLogs.length !== 1 ? 's' : ''} found`}</p>
                </div>

                {logsLoading ? (
                  <div className="flex items-center justify-center py-20 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Loading logs…
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
                    <p className="font-bold">No activity logs found</p>
                    <p className="text-sm mt-1">Actions across all schools will appear here once logged.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">When</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">School</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Role</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">User</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Action</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => {
                          const school = schools.find(s => s.id === log.school_id);
                          const actionMeta: Record<string, { label: string; colour: string }> = {
                            'result.publish':    { label: 'Results Published',   colour: 'bg-emerald-100 text-emerald-700' },
                            'result.unpublish':  { label: 'Results Unpublished', colour: 'bg-orange-100 text-orange-700' },
                            'student.add':       { label: 'Student Added',       colour: 'bg-blue-100 text-blue-700' },
                            'student.delete':    { label: 'Student Deleted',     colour: 'bg-red-100 text-red-700' },
                            'student.upload':    { label: 'Students Uploaded',   colour: 'bg-violet-100 text-violet-700' },
                            'teacher.add':       { label: 'Teacher Added',       colour: 'bg-blue-100 text-blue-700' },
                            'teacher.delete':    { label: 'Teacher Deleted',     colour: 'bg-red-100 text-red-700' },
                            'timetable.generate':{ label: 'Timetable Generated', colour: 'bg-cyan-100 text-cyan-700' },
                            'timetable.clear':   { label: 'Timetable Cleared',   colour: 'bg-orange-100 text-orange-700' },
                            'results.upload':    { label: 'Results Uploaded',    colour: 'bg-violet-100 text-violet-700' },
                            'attendance.mark':   { label: 'Attendance Marked',   colour: 'bg-teal-100 text-teal-700' },
                            'report.print':      { label: 'Report Printed',      colour: 'bg-slate-100 text-slate-700' },
                          };
                          const meta = actionMeta[log.action] ?? { label: log.action, colour: 'bg-slate-100 text-slate-600' };
                          const details = log.details ?? {};
                          const detailStr = Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(' · ');
                          const ts = new Date(log.created_at);
                          return (
                            <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                <div>{ts.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                <div className="text-xs text-slate-400">{ts.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</div>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">{school?.name ?? `School ${log.school_id ?? '—'}`}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${log.user_role === 'admin' ? 'bg-blue-50 text-blue-700' : log.user_role === 'teacher' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {log.user_role ?? '—'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600 max-w-[180px] truncate">{log.user_name ?? '—'}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-xl text-xs font-bold ${meta.colour}`}>{meta.label}</span>
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-xs max-w-[220px] truncate" title={detailStr}>{detailStr || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'templates' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Create Assessment Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Template Name</label>
                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500" placeholder="e.g. Grade 4 Term 1" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Grade Level</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500">
                      <option>Grade 4</option>
                      <option>Grade 5</option>
                      <option>Grade 6</option>
                      <option>Grade 7</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Term</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500">
                      <option>Term 1</option>
                      <option>Term 2</option>
                      <option>Term 3</option>
                      <option>Term 4</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all">
                      Save Template
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messaging */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-8 right-8 px-8 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 font-bold ${
                message.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
