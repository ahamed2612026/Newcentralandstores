/* ============================================================
   CENTRAL & STORES — Live Products from Supabase
   Fetches published products and exposes them as:
     window.productsData → [{ id, name, category, weight, price, image, ... }]
   ============================================================ */

window.productsData = [];

async function loadLiveProducts() {
  try {
    const { data, error } = await db
      .from('products')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error.message);
      document.dispatchEvent(new CustomEvent('productsLoaded', { detail: [] }));
      return [];
    }

    // Map Supabase shape → shape the existing website expects
    const mapped = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category || '',
      weight: p.weight || '',
      price: Number(p.price) || 0,
      image: p.image_url || '',
      is_available: p.is_available !== false,
      is_featured: p.is_featured === true,
      description: p.description || ''
    }));

    window.productsData = mapped;

    // Dispatch event so the grid can re-render once data arrives
    document.dispatchEvent(new CustomEvent('productsLoaded', { detail: mapped }));

    return mapped;
  } catch (err) {
    console.error('Failed to load products:', err);
    document.dispatchEvent(new CustomEvent('productsLoaded', { detail: [] }));
    return [];
  }
}

// Load as soon as the script runs
loadLiveProducts();
