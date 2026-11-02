require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./presentation/errorHandlers');
const { sequelize, conectar } = require('./infrastructure/database');
const db = require('./infrastructure/models');

const CategoriaRepositorySQL = require('./infrastructure/repositories/CategoriaRepositorySQL');
const ProductoRepositorySQL = require('./infrastructure/repositories/ProductoRepositorySQL');
const ClienteRepositorySQL = require('./infrastructure/repositories/ClienteRepositorySQL');
const PedidoRepositorySQL = require('./infrastructure/repositories/PedidoRepositorySQL');

const CategoriaService = require('./application/services/CategoriaService');
const ProductoService = require('./application/services/ProductoService');
const ClienteService = require('./application/services/ClienteService');
const PedidoService = require('./application/services/PedidoService');

const categoriaRepo = new CategoriaRepositorySQL(db);
const productoRepo = new ProductoRepositorySQL(db);
const clienteRepo = new ClienteRepositorySQL(db);
const pedidoRepo = new PedidoRepositorySQL(db);

const categoriaService = new CategoriaService({ categoriaRepository: categoriaRepo, productoRepository: productoRepo });
const productoService = new ProductoService({ productoRepository: productoRepo, categoriaRepository: categoriaRepo, pedidoRepository: pedidoRepo });
const clienteService = new ClienteService({ clienteRepository: clienteRepo });
const pedidoService = new PedidoService({ pedidoRepository: pedidoRepo, productoRepository: productoRepo, clienteRepository: clienteRepo });

const { init: initCategorias } = require('./presentation/routes/categorias');
const { init: initProductos } = require('./presentation/routes/productos');
const { init: initClientes } = require('./presentation/routes/clientes');
const { init: initPedidos } = require('./presentation/routes/pedidos');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/categorias', initCategorias(categoriaService));
app.use('/productos', initProductos(productoService));
app.use('/clientes', initClientes(clienteService));
app.use('/pedidos', initPedidos(pedidoService));

app.get('/salud', (req, res) => {
  res.json({ estado: 'ok' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

conectar().then(() => {
  app.listen(PORT, () => {
    console.log('Servidor en http://localhost:' + PORT);
  });
});

module.exports = app;
