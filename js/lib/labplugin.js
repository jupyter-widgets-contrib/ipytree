var ipytree = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'ipytree',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'ipytree',
          version: ipytree.version,
          exports: ipytree
      });
  },
  autoStart: true
};

