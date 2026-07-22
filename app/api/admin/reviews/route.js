import { getSupabaseAdmin } from '../../../../lib/supabase';
import { checkAdminAuth } from '../../../../lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data });
}

export async function PATCH(request) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const body = await request.json();
  const { id, status, review_text, add_images, remove_image_url } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from('reviews')
    .select('image_urls')
    .eq('id', id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  let imageUrls = existing.image_urls || [];

  if (remove_image_url) {
    imageUrls = imageUrls.filter((url) => url !== remove_image_url);
  }

  if (Array.isArray(add_images)) {
    for (const img of add_images) {
      try {
        const fileName = `${crypto.randomUUID()}-${img.name}`;
        const buffer = Buffer.from(img.base64, 'base64');
        const { error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(fileName, buffer, { contentType: 'image/*' });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('review-images')
            .getPublicUrl(fileName);
          imageUrls.push(publicUrlData.publicUrl);
        }
      } catch (e) {
        console.error('Admin image upload failed:', e);
      }
    }
  }

  const updates = { image_urls: imageUrls };
  if (status) {
    updates.status = status;
    updates.reviewed_at = new Date().toISOString();
  }
  if (typeof review_text === 'string') {
    updates.review_text = review_text;
  }

  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, review: data });
}
