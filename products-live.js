/* ============================================================
   CENTRAL & STORES — Live Products from Supabase
   Order: hard-coded catalog FIRST, Supabase products AFTER.
   Duplicates (same name) → hard-coded version wins.
   ============================================================ */

window.productsData = [];

/* ------------------------------------------------------------
   1. Build the hard-coded catalog from the existing files.
   ------------------------------------------------------------ */
function getHardCodedProducts() {
  try {
    const base =
      typeof productsData !== 'undefined' && Array.isArray(productsData)
        ? productsData
        : [];

    const prices =
      typeof productPrices !== 'undefined' && productPrices
        ? productPrices
        : {};

    const images =
      typeof productImages !== 'undefined' && productImages
        ? productImages
        : {};

    return base.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category || '',
      weight: p.weight || '',
      price: Number(prices[p.id] ?? 0),
      image: images[p.id] || '',
      is_available: true,
      is_featured: false,
      description: '',
      __source: 'hardcoded'
    }));
  } catch (e) {
    console.warn('Hard-coded catalog not available:', e);
    return [];
  }
}

/* ------------------------------------------------------------
   2. Fetch published products from Supabase.
   ------------------------------------------------------------ */
async function fetchSupabaseProducts() {
  try {
    const { data, error } = await db
      .from('products')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: true });   // oldest first → newest last

    if (error) {
      console.error('Supabase error:', error.message);
      return [];
    }

    return (data || []).map(p => ({
      id: 'sb-' + p.id,          // prefix to avoid ID clash with hard-coded
      name: p.name,
      category: p.category || '',
      weight: p.weight || '',
      price: Number(p.price) || 0,
      image: p.image_url || '',
      is_available: p.is_available !== false,
      is_featured: p.is_featured === true,
      description: p.description || '',
      __source: 'supabase'
    }));
  } catch (err) {
    console.error('Failed to load Supabase products:', err);
    return [];
  }
}

/* ------------------------------------------------------------
   3. Merge: hard-coded first, then Supabase. Skip Supabase
      items whose name already exists in the hard-coded list.
   ------------------------------------------------------------ */
async function loadLiveProducts() {
  const hardCoded = getHardCodedProducts();

  // Names already in the hard-coded catalog (lowercase, trimmed)
  const existingNames = new Set(
    hardCoded.map(p => p.name.toLowerCase().trim())
  );

  const supabaseProducts = await fetchSupabaseProducts();

  // Keep only Supabase items that are NOT duplicates
  const supabaseFiltered = supabaseProducts.filter(
    p => !existingNames.has(p.name.toLowerCase().trim())
  );

  // Order: hard-coded first, new Supabase products after
  window.productsData = [...hardCoded, ...supabaseFiltered];

  // Tell the grid the data is ready
  document.dispatchEvent(
    new CustomEvent('productsLoaded', { detail: window.productsData })
  );

  return window.productsData;
}

// Fire immediately
loadLiveProducts();
