import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { CaseEditor } from '@/components/CaseEditor';
import { motion, AnimatePresence } from 'framer-motion';

type Case = {
  id: string;
  title: string;
  patient_name: string | null;
  age: number | null;
  sex: string | null;
  chief_complaint: string | null;
  history: string | null;
  vitals: any;
  status: string;
  created_at: string;
};

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useI18n();

  const fetchCases = async () => {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) toast.error(error.message);
    else setCases(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCases(); }, []);

  const createCase = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('cases')
      .insert({ user_id: user.id, title: 'New Case' })
      .select()
      .single();
    if (error) toast.error(error.message);
    else {
      setCases((prev) => [data, ...prev]);
      setSelectedCase(data);
    }
  };

  const statusColor: Record<string, string> = {
    active: 'bg-success/10 text-success',
    archived: 'bg-muted text-muted-foreground',
    resolved: 'bg-info/10 text-info',
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-5rem)]">
      {/* Cases List */}
      <div className="w-80 shrink-0 flex flex-col glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-semibold text-sm">{t('cases.title')}</h2>
          <Button size="sm" onClick={createCase} className="h-8 gap-1">
            <Plus className="h-3.5 w-3.5" /> {t('cases.new')}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">{t('common.loading')}</div>
          ) : cases.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              {t('cases.empty')}
            </div>
          ) : (
            <AnimatePresence>
              {cases.map((c) => (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedCase(c)}
                  className={`w-full text-left p-3 rounded-lg transition-all group ${
                    selectedCase?.id === c.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-secondary/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{c.title}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {c.patient_name && (
                      <span className="text-xs text-muted-foreground truncate">{c.patient_name}</span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColor[c.status] || ''}`}>
                      {t(`cases.${c.status}`)}
                    </span>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Case Editor */}
      <div className="flex-1 min-w-0">
        {selectedCase ? (
          <CaseEditor
            caseData={selectedCase}
            onUpdate={(updated) => {
              setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
              setSelectedCase(updated);
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center glass-panel rounded-xl">
            <div className="text-center text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a case or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
