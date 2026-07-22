import { getSupabasePublic } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('product_id');

  if (!productId) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
  }

  const supabase = getSupabasePublic();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, customer_name, rating, review_text, image_urls, created_at')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data });
}

export async function POST(request) {
  const supabase = getSupabasePublic();
  const body = await request.json();

  const {
    product_id,
    product_title,
    customer_name,
    customer_email,
    rating,
    review_text,
    images,
  } = body;

  if (!product_id || !customer_name || !rating || !review_text) {
    return NextResponse.json(
      { error: 'product_id, customer_name, rating, and review_text are required' },
      { status: 400 }
    );
  }

  const imageUrls = [];
  if (Array.isArray(images)) {
    for (const img of images) {
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
        console.error('Image upload failed:', e);
      }
    }
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      product_id,
      product_title: product_title || null,
      customer_name,
      customer_email: customer_email || null,
      rating,
      review_text,
      image_urls: imageUrls,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, review: data });
}
