const { mapProduct, mapVariant } = require('./productMapper');
const { mapCategory } = require('./categoryMapper');
const { mapUser } = require('./userMapper');
const { mapOrder, mapOrderDetail } = require('./orderMapper');

module.exports = { mapProduct, mapVariant, mapCategory, mapUser, mapOrder, mapOrderDetail };
