/* ============================================================
   CENTRAL & STORES — Product Grid
   Reads live products from window.productsData (Supabase)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const productsGrid = document.getElementById("productsGrid");
  const productCount = document.getElementById("productCount");

  if (!productsGrid) {
    console.log("productsGrid not found");
    return;
  }

  // If productsData isn't ready yet, wait for the event
  if (typeof window.productsData === "undefined" || !Array.isArray(window.productsData)) {
    window.productsData = [];
  }

  function renderProducts(items) {
    productsGrid.innerHTML = "";

    if (!items.length) {
      productsGrid.innerHTML = `
        <div class="products-empty-state show">
          <div class="empty-icon">⌕</div>
          <h3>No products found</h3>
          <p>Try another category or search word.</p>
        </div>
      `;
      if (productCount) productCount.textContent = "0 PRODUCTS";
      return;
    }

    items.forEach((product) => {
      const price = product.price ?? 0;

      productsGrid.innerHTML += `
        <article class="product-card" id="product-${product.id}">
          <div class="product-image-wrap">
            ${
              product.image
                ? `<img src="${product.image}" alt="${product.name}" loading="lazy">`
                : `<div class="product-image-placeholder"><span>NO IMAGE</span></div>`
            }

            <button
              class="product-wishlist-btn"
              type="button"
              aria-label="Add ${product.name} to wishlist"
            >♡</button>
          </div>

          <div class="product-details">
            <span class="product-category">${product.category}</span>

            <h3 class="product-name">${product.name}</h3>

            <span class="product-weight">${product.weight}</span>

            <div class="product-footer">
              <strong class="product-price">₹${price}</strong>

              <button
                class="add-cart-btn"
                type="button"
                data-id="${product.id}"
              >+ Add</button>
            </div>
          </div>
        </article>
      `;
    });

    if (productCount) {
      productCount.textContent = `${items.length} PRODUCTS`;
    }
  }

  // Initial render (empty until Supabase responds)
  renderProducts(window.productsData);

  // When Supabase finishes loading, re-render with real data
  document.addEventListener('productsLoaded', () => {
    const fresh = window.productsData.slice();
    renderProducts(fresh);

    // Reset category pill to "All"
    document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
    const allBtn = document.querySelector('.category-pill[data-category="All"]');
    if (allBtn) allBtn.classList.add('active');
  });

  // Category filter
  const categoryButtons = document.querySelectorAll(".category-pill");

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedCategory = button.dataset.category;

      categoryButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const all = window.productsData.slice();

      if (selectedCategory === "All") {
        renderProducts(all);
      } else {
        const filtered = all.filter((product) => product.category === selectedCategory);
        renderProducts(filtered);
      }
    });
  });

  // Add to cart
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".add-cart-btn");
    if (!button) return;

    const id = button.dataset.id;

    const product = window.productsData.find(
      (item) => String(item.id) === String(id)
    );

    if (!product) return;

    const price = product.price ?? 0;
    const image = product.image || "";

    if (typeof addProductToCart === "function") {
      addProductToCart({
        id: product.id,
        name: product.name,
        category: product.category,
        weight: product.weight,
        price: price,
        image: image
      });
    } else {
      console.error("cart-common.js not loaded");
    }

    const oldText = button.innerHTML;

    button.classList.add("added");
    button.innerHTML = "✓ Added";

    setTimeout(() => {
      button.classList.remove("added");
      button.innerHTML = oldText;
    }, 900);
  });
});
