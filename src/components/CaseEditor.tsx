import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

type CaseData = {
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

export function CaseEditor({ caseData, onUpdate }: { caseData: CaseData; onUpdate: (c: CaseData) => void }) {
  const [form, setForm] = useState(caseData);
  const [saving, setSaving] = useState(false);
  const { t } = useI18n();

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const save = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from('cases')
      .update({
        title: form.title,
        patient_name: form.patient_name,
        age: form.age,
        sex: form.sex,
        chief_complaint: form.chief_complaint,
        history: form.history,
        vitals: form.vitals,
        status: form.status,
      })
      .eq('id', form.id)
      .select()
      .single();
    if (error) toast.error(error.message);
    else {
      toast.success('Case saved');
      onUpdate(data);
    }
    setSaving(false);
  };

  return (
    <div className="glass-panel rounded-xl p-6 h-full overflow-y-auto scrollbar-thin space-y-6">
      <div className="flex items-center justify-between">
        <Input
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          className="text-lg font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0 max-w-md"
        />
        <div className="flex gap-2">
          <Select value={form.status} onValueChange={(v) => update('status', v)}>
            <SelectTrigger className="w-32 h-8 text-xs bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t('cases.active')}</SelectItem>
              <SelectItem value="archived">{t('cases.archived')}</SelectItem>
              <SelectItem value="resolved">{t('cases.resolved')}</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={save} disabled={saving} className="gap-1.5 h-8">
            <Save className="h-3.5 w-3.5" /> {t('common.save')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t('cases.patient')}</Label>
          <Input
            value={form.patient_name || ''}
            onChange={(e) => update('patient_name', e.target.value)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t('cases.age')}</Label>
          <Input
            type="number"
            value={form.age ?? ''}
            onChange={(e) => update('age', e.target.value ? Number(e.target.value) : null)}
            className="bg-secondary/50 border-border/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t('cases.sex')}</Label>
          <Select value={form.sex || ''} onValueChange={(v) => update('sex', v)}>
            <SelectTrigger className="bg-secondary/50 border-border/50">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t('common.male')}</SelectItem>
              <SelectItem value="female">{t('common.female')}</SelectItem>
              <SelectItem value="other">{t('common.other')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t('cases.complaint')}</Label>
        <Textarea
          value={form.chief_complaint || ''}
          onChange={(e) => update('chief_complaint', e.target.value)}
          className="bg-secondary/50 border-border/50 min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t('cases.history')}</Label>
        <Textarea
          value={form.history || ''}
          onChange={(e) => update('history', e.target.value)}
          className="bg-secondary/50 border-border/50 min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t('cases.vitals')}</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['BP', 'HR', 'Temp', 'SpO2'].map((vital) => (
            <div key={vital} className="space-y-1">
              <span className="text-xs text-muted-foreground">{vital}</span>
              <Input
                value={(form.vitals as any)?.[vital] || ''}
                onChange={(e) => update('vitals', { ...(form.vitals || {}), [vital]: e.target.value })}
                className="bg-secondary/50 border-border/50 h-8 text-sm"
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
