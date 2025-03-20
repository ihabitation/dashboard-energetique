const { override, addBabelPlugin, addWebpackModuleRule } = require('customize-cra');

module.exports = override(
  addBabelPlugin('@babel/plugin-transform-optional-chaining'),
  addBabelPlugin('@babel/plugin-transform-nullish-coalescing-operator'),
  addBabelPlugin('@babel/plugin-transform-class-properties'),
  addBabelPlugin('@babel/plugin-transform-private-methods'),
  addBabelPlugin('@babel/plugin-transform-private-property-in-object'),
  addWebpackModuleRule({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false
    }
  }),
  addWebpackModuleRule({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto'
  })
); 