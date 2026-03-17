import { supabase } from '@/lib/supabase';
import type { DocumentRow, DocumentType } from '@/lib/database.types';

export type { DocumentRow };

export async function getDocumentsForLoad(loadId: string): Promise<DocumentRow[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('load_id', loadId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DocumentRow[];
}

export async function uploadDocument(params: {
  loadId: string;
  uploadedBy: string;
  companyId: string | null;
  type: DocumentType;
  file: File;
}): Promise<DocumentRow> {
  const ext = params.file.name.split('.').pop() ?? 'bin';
  const path = `${params.loadId}/${params.type}-${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(path, params.file, { contentType: params.file.type, upsert: false });
  if (storageError) throw new Error(storageError.message);

  // Get public/signed URL
  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);

  // Insert document row
  const { data, error } = await supabase
    .from('documents')
    .insert({
      load_id: params.loadId,
      uploaded_by: params.uploadedBy,
      company_id: params.companyId,
      type: params.type,
      file_name: params.file.name,
      file_url: urlData.publicUrl,
      file_size_bytes: params.file.size,
      mime_type: params.file.type,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DocumentRow;
}

export async function getSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 3600); // 1 hour
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
