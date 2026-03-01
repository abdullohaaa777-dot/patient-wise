import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { ShieldAlert, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

type RiskScore = {
  id: string;
  case_id: string;
  score: number;
  category: string | null;
  details: any;
  created_at: string;
};

export default function RiskPage() {
  const [scores, setScores] = useState<RiskScore[]>([]);
  const { t } = useI18n();

  useEffect(() => {
    supabase
      .from('risk_scores')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setScores(data || []));
  }, []);

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: t('risk.critical'), color: 'text-destructive', bg: 'bg-destructive/10' };
    if (score >= 60) return { label: t('risk.high'), color: 'text-warning', bg: 'bg-warning/10' };
    if (score >= 30) return { label: t('risk.medium'), color: 'text-info', bg: 'bg-info/10' };
    return { label: t('risk.low'), color: 'text-success', bg: 'bg-success/10' };
  };

  return (
    <div className="h-[calc(100vh-5rem)] space-y-4">
      <div className="glass-panel rounded-xl p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <ShieldAlert className="h-5 w-5 text-primary" />
          {t('risk.title')}
        </h2>

        {scores.length === 0 ? (
          <div className="text-center py-16">
            <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">No risk assessments yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Risk scores will appear after AI analysis of cases.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scores.map((s, i) => {
              const level = getRiskLevel(Number(s.score));
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl border border-border/50 ${level.bg}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-2xl font-bold ${level.color}`}>{Number(s.score).toFixed(0)}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${level.bg} ${level.color}`}>
                      {level.label}
                    </span>
                  </div>
                  {s.category && <p className="text-xs text-muted-foreground">{s.category}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
