const mapCategory = (category) => {
  const data = category.toJSON ? category.toJSON() : category;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    isActive: data.isActive,
  };
};

module.exports = { mapCategory };
