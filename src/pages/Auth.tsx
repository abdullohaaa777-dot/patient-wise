import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Activity, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;

        if (data?.user) {
          if (data.session) {
            toast.success(t('auth.signup') + ' ' + t('common.loading'));
            navigate('/');
          } else {
            toast.success('Check your email to confirm your account!');
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-4"
      >
        <div className="glass-panel rounded-2xl p-8 space-y-6">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Brain className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{t('auth.welcome')}</h1>
            <p className="text-muted-foreground text-sm">{t('auth.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullname">{t('auth.fullname')}</Label>
                <Input
                  id="fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. John Doe"
                  className="bg-secondary/50 border-border/50"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@clinic.com"
                required
                className="bg-secondary/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-secondary/50 border-border/50"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : isLogin ? (
                t('auth.login')
              ) : (
                t('auth.signup')
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? t('auth.no_account') : t('auth.have_account')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
