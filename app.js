require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const errorHandler = require('./presentation/errorHandlers');
const { conectar } = require('./infrastructure/database');
const db = require('./infrastructure/models');
const { autenticar, soloAdmin } = require('./presentation/middlewares/auth');
const { crearRouterAuth } = require('./presentation/routes/auth');
const VarianteService = require('./application/services/VarianteService');
const variantesRoutes = require('./presentation/routes/variantes');
const TablaService = require('./application/services/TablaService');
const TablaRepositorySQL = require('./infrastructure/repositories/TablaRepositorySQL');
const tablasRoutes = require('./presentation/routes/tablas');

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

const categoriaService = new CategoriaService({
  categoriaRepository: categoriaRepo,
  productoRepository: productoRepo,
});
const productoService = new ProductoService({
  productoRepository: productoRepo,
  categoriaRepository: categoriaRepo,
  pedidoRepository: pedidoRepo,
});
const clienteService = new ClienteService({ clienteRepository: clienteRepo });
const pedidoService = new PedidoService({
  pedidoRepository: pedidoRepo,
  productoRepository: productoRepo,
  clienteRepository: clienteRepo,
});

const { init: initCategorias } = require('./presentation/routes/categorias');
const { init: initProductos } = require('./presentation/routes/productos');
const { init: initClientes } = require('./presentation/routes/clientes');
const { init: initPedidos } = require('./presentation/routes/pedidos');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', crearRouterAuth());
app.use(
  '/admin/tablas',
  tablasRoutes(new TablaService(new TablaRepositorySQL())),
);
const protegerEscritura = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  autenticar(req, res, (err) => (err ? next(err) : soloAdmin(req, res, next)));
};
app.use('/categorias', protegerEscritura);
app.use('/productos', protegerEscritura);
app.use(
  '/productos/:id/variantes',
  variantesRoutes(new VarianteService(productoRepo)),
);
app.use('/clientes', autenticar, soloAdmin);
app.use('/pedidos', autenticar);

app.use('/categorias', initCategorias(categoriaService));
app.use('/productos', initProductos(productoService));
app.use('/clientes', initClientes(clienteService));
app.use('/pedidos', initPedidos(pedidoService));

app.get('/', (req, res) => res.redirect('/api-docs/'));

app.get('/salud', (req, res) => {
  res.json({ estado: 'ok' });
});

app.get('/openapi.json', (req, res) =>
  res.json(require('./docs/openapi.json')),
);
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    customSiteTitle: 'Swagger — API Tienda',
    swaggerOptions: {
      url: '/openapi.json',
      validatorUrl: null,
      persistAuthorization: false,
    },
  }),
);
app.use((req, res) =>
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Ruta no encontrada', details: [] },
  }),
);

app.use(errorHandler);

async function start() {
  require('./infrastructure/security/tokens').validarConfiguracionAuth();
  await conectar();
  const port = Number(process.env.PORT || 3000);
  return app.listen(port, () => {
    console.log('Servidor en http://localhost:' + port);
    console.log('Swagger en http://localhost:' + port + '/api-docs/');
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error('No se pudo iniciar el servidor:', error);
    process.exitCode = 1;
  });
}

app.start = start;
module.exports = app;
