var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var $ = require('jquery');
require('jstree/dist/themes/default/32px.png');
require('jstree/dist/themes/default/40px.png');
require('jstree/dist/themes/default/throbber.gif');
require('jstree/dist/themes/default/style.css');
require('./tree.css');
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
        opened: true,
        disabled: false,
        selected: false,
        show_icon: true,
        icon: 'folder',
        icon_color: 'silver',
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
            this.tree = $(this.treeView.el).jstree(true);
            this.renderNode();
        });
    },

    renderNode: function() {
        this.tree.create_node(
            this.parentModel.get('_id'),
            {
                id: this.model.get('_id'),
                text: this.model.get('name'),
                icon: this.getIcon(),
                state: {
                    opened: this.model.get('opened'),
                    disabled: this.model.get('disabled'),
                    selected: this.model.get('selected')
                }
            },
            'last',
            _.bind(this.onRendered, this)
        );
    },

    getIcon: function() {
        if(!this.model.get('show_icon')) {
            return false;
        }

        var icon = this.model.get('icon');
        if(!icon.includes('/')) {
            icon = 'fa fa-' + icon + ' ipytree-color-' + this.model.get('icon_color');
        }

        return icon;
    },

    onRendered: function() {
        this.nodeViews = new widgets.ViewList(this.addNodeModel, this.removeNodeView, this);
        this.nodeViews.update(this.model.get('nodes'));

        this.model.on('change:name', _.bind(this.handleNameChange, this));
        this.model.on('change:opened', _.bind(this.handleOpenedChange, this));
        this.model.on('change:disabled', _.bind(this.handleDisabledChange, this));
        this.model.on('change:selected', _.bind(this.handleSelectedChange, this));
        this.model.on('change:show_icon', _.bind(this.handleIconChange, this));
        this.model.on('change:icon', _.bind(this.handleIconChange, this));
        this.model.on('change:icon_color', _.bind(this.handleIconChange, this));
        this.model.on('change:nodes', _.bind(this.handleNodesChange, this));
    },

    addNodeModel: function(nodeModel) {
        return this.create_child_view(nodeModel, {
            treeView: this.treeView,
            parentModel: this.model
        });
    },

    removeNodeView: function(nodeView) {
        // TODO remove the node from the tree
        nodeView.remove();
    },

    handleNameChange: function() {
        this.tree.rename_node(this.model.get('_id'), this.model.get('name'));
    },

    handleOpenedChange: function() {
        if(this.model.get('opened')) {
            this.tree.open_node(this.model.get('_id'));
        } else {
            this.tree.close_node(this.model.get('_id'));
        }
    },

    handleDisabledChange: function() {
        if(this.model.get('disabled')) {
            this.tree.disable_node(this.model.get('_id'));
        } else {
            this.tree.enable_node(this.model.get('_id'));
        }
    },

    handleSelectedChange: function() {
        if(this.model.get('selected')) {
            this.tree.select_node(this.model.get('_id'));
        } else {
            this.tree.deselect_node(this.model.get('_id'));
        }
    },

    handleIconChange: function() {
        this.tree.set_icon(this.model.get('_id'), this.getIcon());
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
                    check_callback: true
                },
                'plugins': [
                    'wholerow'
                ]
            }).on('ready.jstree', () => {
                this.nodeViews = new widgets.ViewList(this.addNodeModel, this.removeNodeView, this);
                this.nodeViews.update(this.model.get('nodes'));

                this.model.on('change:nodes', _.bind(this.handleNodesChange, this));

                this.initTreeEventListeners();

                resolve();
            });
        });
    },

    initTreeEventListeners: function() {
        $(this.el).bind(
            "select_node.jstree", (evt, data) => {
                nodesRegistry[data.node.id].set('selected', true);
            }
        ).bind(
            "deselect_node.jstree", (evt, data) => {
                nodesRegistry[data.node.id].set('selected', false);
            }
        ).bind(
            "select_all.jstree", (evt, data) => {
                for(var id in nodesRegistry) {
                    if($(this.el).jstree(true).get_node(id)) {
                        nodesRegistry[id].set('selected', true);
                    }
                }
            }
        ).bind(
            "deselect_all.jstree", (evt, data) => {
                for(var id in nodesRegistry) {
                    if($(this.el).jstree(true).get_node(id)) {
                        nodesRegistry[id].set('selected', false);
                    }
                }
            }
        ).bind(
            "before_open.jstree", (evt, data) => {
                nodesRegistry[data.node.id].set('opened', true);
            }
        ).bind(
            "close_node.jstree", (evt, data) => {
                nodesRegistry[data.node.id].set('opened', false);
            }
        );
    },

    addNodeModel: function(nodeModel) {
        return this.create_child_view(nodeModel, {
            treeView: this,
            parentModel: this.model,
        });
    },

    removeNodeView: function(nodeView) {
        // TODO Remove node from the tree
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
