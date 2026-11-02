const mapVariant = (variant) => {
  const data = variant.toJSON ? variant.toJSON() : variant;

  return {
    id: data.id,
    sku: data.sku,
    size: data.size,
    color: data.color,
    price: data.price === null ? null : Number(data.price),
    stock: data.stock,
    imageUrl: data.imageUrl,
  };
};

const mapProduct = (product) => {
  const data = product.toJSON ? product.toJSON() : product;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    price: Number(data.price),
    stock: data.stock,
    sku: data.sku,
    brand: data.brand,
    imageUrl: data.imageUrl,
    isActive: data.isActive,
    categoryId: data.categoryId,
    category: data.category ? {
      id: data.category.id,
      name: data.category.name,
      slug: data.category.slug,
    } : undefined,
    variants: data.variants ? data.variants.map(mapVariant) : undefined,
  };
};

module.exports = { mapProduct, mapVariant };
