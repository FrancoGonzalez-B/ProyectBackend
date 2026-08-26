const express = require('express');
const app = express();
const PORT = 3000;

const productRoutes = require('./routes/productRoutes');
const authMiddleware = require('./middleware/auth')

app.use('/api/products', productRoutes);

app.use(express.json()); // Middleware para parsear JSON

app.use('/api/products', authMiddleware, productRoutes); // Protege las rutas de productos con el middleware de autenticación

app.get('/', (req, res) => {
  res.send('Backend funcionando 🚀');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
