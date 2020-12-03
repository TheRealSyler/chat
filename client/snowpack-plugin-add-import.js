
module.exports = function (snowpackConfig, pluginOptions) {
  return {
    name: 'snowpack-plugin-add-import',
    async transform ({ id, contents, isDev, fileExt }) {
      if (fileExt === '.html') {
        return contents.replace(/(<body>)((.|\W)*<\/body>)/, '$1\n<script type="module" src="/_dist_/index.js"></script>\n$2');
      }
    },
  };
};
