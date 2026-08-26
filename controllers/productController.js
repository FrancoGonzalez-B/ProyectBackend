let products = [
  { id: 1, name: 'Cuchilla', price: 5000 },
  { id: 2, name: 'Shampoo', price: 3000 }
];

// Obtener todos
exports.getProducts = (req, res) => {
  res.json(products);
};

// Obtener uno por ID
exports.getProductById = (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  product ? res.json(product) : res.status(404).json({ message: 'Producto no encontrado' });
};

// Crear
exports.createProduct = (req, res) => {
  const newProduct = {
    id: products.length + 1,
    name: req.body.name,
    price: req.body.price
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
};

// Actualizar
exports.updateProduct = (req, res) => {
  const product = products.find(p => p.id == req.params.id);
  if (product) {
    product.name = req.body.name || product.name;
    product.price = req.body.price || product.price;
    res.json(product);
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
};

// Eliminar
exports.deleteProduct = (req, res) => {
  products = products.filter(p => p.id != req.params.id);
  res.json({ message: 'Producto eliminado' });
};
