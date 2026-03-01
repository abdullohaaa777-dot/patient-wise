import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n';
import { Upload, File, Image, FileText, Dna, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type UploadRecord = {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
};

export default function UploadsPage() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    supabase
      .from('uploads')
      .select('id, file_name, file_type, file_size, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => setUploads(data || []));
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (!user) return;
    setUploading(true);
    const fileArr = Array.from(files);
    for (const file of fileArr) {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: storageErr } = await supabase.storage
        .from('case-uploads')
        .upload(path, file);
      if (storageErr) { toast.error(`Upload failed: ${file.name}`); continue; }

      const { error: dbErr } = await supabase.from('uploads').insert({
        user_id: user.id,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_path: path,
        file_size: file.size,
      });
      if (dbErr) toast.error(dbErr.message);
      else {
        setUploads((prev) => [
          { id: crypto.randomUUID(), file_name: file.name, file_type: file.type, file_size: file.size, created_at: new Date().toISOString() },
          ...prev,
        ]);
      }
    }
    setUploading(false);
    toast.success(`${fileArr.length} file(s) uploaded`);
  }, [user]);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5 text-info" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-destructive" />;
    if (type.includes('dicom') || type.includes('dcm')) return <File className="h-5 w-5 text-warning" />;
    if (type.includes('vcf')) return <Dna className="h-5 w-5 text-success" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={`glass-panel rounded-xl p-10 text-center cursor-pointer transition-all border-2 border-dashed ${
          dragging ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'
        }`}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = '.pdf,.jpg,.jpeg,.png,.dicom,.dcm,.vcf';
          input.onchange = (e) => handleFiles((e.target as HTMLInputElement).files!);
          input.click();
        }}
      >
        <Upload className={`h-10 w-10 mx-auto mb-3 transition-colors ${dragging ? 'text-primary' : 'text-muted-foreground/40'}`} />
        <p className="font-medium text-sm">{uploading ? t('common.loading') : t('uploads.drag')}</p>
        <p className="text-xs text-muted-foreground mt-1">{t('uploads.types')}</p>
      </div>

      {/* Files list */}
      <div className="flex-1 glass-panel rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h2 className="font-semibold text-sm">{t('uploads.title')}</h2>
        </div>
        <div className="overflow-y-auto scrollbar-thin p-2 space-y-1">
          <AnimatePresence>
            {uploads.map((u) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors"
              >
                {getFileIcon(u.file_type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.file_size ? `${(u.file_size / 1024).toFixed(1)} KB` : '—'} · {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
