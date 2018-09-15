var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var $ = require('jquery');
require('jstree/dist/themes/default/32px.png');
require('jstree/dist/themes/default/40px.png');
require('jstree/dist/themes/default/throbber.gif');
require('jstree/dist/themes/default/style.css');
// require('jstree/dist/themes/default-dark/style.css');
require('jstree');

var nodesRegistry = {};

var NodeModel = widgets.WidgetModel.extend({
    defaults: _.extend(widgets.WidgetModel.prototype.defaults(), {
        _model_name: 'NodeModel',
        _view_name: 'NodeView',
        _model_module: 'ipytree',
        _view_module: 'ipytree',
        _model_module_version: '0.1.0',
        _view_module_version: '0.1.0',
        name: 'Node',
        nodes: [],
        _id: '',
    }),

    initialize: function() {
        NodeModel.__super__.initialize.apply(this, arguments);

        nodesRegistry[this.get('_id')] = this;
    },
}, {
    serializers: _.extend({
        nodes: { deserialize: widgets.unpack_models },
    }, widgets.WidgetModel.serializers)
});

var NodeView = widgets.WidgetView.extend({
    initialize: function (parameters) {
        NodeView.__super__.initialize.apply(this, arguments);

        this.parentModel = this.options.parentModel;
        this.treeView = this.options.treeView;

        this.treeView.waitTree.then(() => {
            this.renderNode();
        });
    },

    renderNode: function() {
        $(this.treeView.el).jstree(true).create_node(
            this.parentModel.get('_id'),
            {
                'id': this.model.get('_id'),
                'text': this.model.get('name')
            },
            'last',
            _.bind(this.onRendered, this)
        );
    },

    onRendered: function() {
        this.nodeViews = new widgets.ViewList(this.addNodeModel, this.removeNodeView, this);
        this.nodeViews.update(this.model.get('nodes'));

        this.model.on('change:name', _.bind(this.handleNameChange, this));
        this.model.on('change:nodes', _.bind(this.handleNodesChange, this));
    },

    addNodeModel: function(nodeModel) {
        return this.create_child_view(nodeModel, {
            treeView: this.treeView,
            parentModel: this.model
        });
    },

    removeNodeView: function(nodeView) {
        nodeView.remove();
    },

    handleNameChange: function() {
        $(this.treeView.el).jstree(true).rename_node(
            this.model.get('_id'),
            this.model.get('name')
        );
    },

    handleNodesChange: function() {
        this.nodeViews.update(this.model.get('nodes'));
    },
});


var TreeModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name: 'TreeModel',
        _view_name: 'TreeView',
        _model_module: 'ipytree',
        _view_module: 'ipytree',
        _model_module_version: '0.1.0',
        _view_module_version: '0.1.0',
        nodes: [],
        _id: '#'
    })
}, {
    serializers: _.extend({
        nodes: { deserialize: widgets.unpack_models },
    }, widgets.DOMWidgetModel.serializers)
});

var TreeView = widgets.DOMWidgetView.extend({
    render: function() {
        this.waitTree = new Promise((resolve, reject) => {
            $(this.el).jstree({
                'core': {
                    'check_callback': true
                }
            }).on('ready.jstree', () => {
                this.nodeViews = new widgets.ViewList(this.addNodeModel, this.removeNodeView, this);
                this.nodeViews.update(this.model.get('nodes'));

                this.model.on('change:nodes', _.bind(this.handleNodesChange, this));

                resolve();
            });
        });
    },

    addNodeModel: function(nodeModel) {
        return this.create_child_view(nodeModel, {
            treeView: this,
            parentModel: this.model,
        });
    },

    removeNodeView: function(nodeView) {
        nodeView.remove();
    },

    handleNodesChange: function() {
        this.nodeViews.update(this.model.get('nodes'));
    },
});


module.exports = {
    NodeModel: NodeModel,
    NodeView: NodeView,
    TreeModel: TreeModel,
    TreeView: TreeView,
};
