import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://sldwxyxyirayfxvukcgo.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const bucketName = process.env.SUPABASE_BUCKET || 'report-images';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function uploadImage(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `reports/${timestamp}_${sanitizedName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn('Supabase Storage upload warning (falling back to local storage):', error.message);
      return saveLocalFile(fileBuffer, sanitizedName);
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    return publicData.publicUrl;
  } catch (err) {
    console.warn('Storage exception, saving locally:', err);
    return saveLocalFile(fileBuffer, fileName);
  }
}

function saveLocalFile(fileBuffer: Buffer, fileName: string): string {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const filePath = path.join(uploadsDir, `${timestamp}_${fileName}`);
  fs.writeFileSync(filePath, fileBuffer);

  const baseUrl = process.env.API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}/uploads/${timestamp}_${fileName}`;
}
