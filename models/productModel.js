const { Sequelize, DataTypes } = require('sequelize');

// Conexión a la base de datos (ajusta usuario, contraseña y nombre de BD)
const sequelize = new Sequelize('backendTienda', 'root', 'tu_password', {
  host: 'localhost',
  dialect: 'mysql'
});

// Definir el modelo Producto
const Product = sequelize.define('Product', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, {
  timestamps: true // agrega createdAt y updatedAt automáticamente
});

// Exportar modelo y conexión
module.exports = { Product, sequelize };
