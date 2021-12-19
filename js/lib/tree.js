var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var $ = require('jquery');
require('./theme/style.css');
require('jstree');

var nodesRegistry = {};

var NodeModel = widgets.WidgetModel.extend({
    defaults: _.extend(widgets.WidgetModel.prototype.defaults(), {
        _model_name: 'NodeModel',
        _view_name: 'NodeView',
        _model_module: 'ipytree',
        _view_module: 'ipytree',
        name: 'Node',
        opened: true,
        disabled: false,
        selected: false,
        show_icon: true,
        icon: 'folder',
        icon_image: '',
        icon_style: 'default',
        open_icon: 'plus',
        open_icon_style: 'default',
        close_icon: 'minus',
        close_icon_style: 'default',
        nodes: [],
        _id: '',
    }),

    initialize: function() {
        NodeModel.__super__.initialize.apply(this, arguments);

        nodesRegistry[this.get('_id')] = this;
    },

    contains: function(node) {
        // Recursively search for node
        // params:
        //      node <string>: id of the node to search for
        // Returns true if found
        if (node == this.get("_id")) return true;
        var arr = this.get('nodes');
        for (var i=0; i<arr.length; i++) {
            var child = arr[i];
            if (child.contains(node)) {
                return true;
            }
        }
        return false;
    }
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
        var icon_image = this.model.get('icon_image');
        if (icon_image) {
            icon = icon_image;
        } else {
            icon = 'fa fa-' + icon + ' ipytree-style-' + this.model.get('icon_style');
        }
        return icon;
    },

    getOpenIcon: function() {
        var icon = this.model.get('open_icon');
        icon = 'fa fa-' + icon + ' ipytree-style-' + this.model.get('open_icon_style');

        return icon;
    },

    getCloseIcon: function() {
        var icon = this.model.get('close_icon');
        icon = 'fa fa-' + icon + ' ipytree-style-' + this.model.get('close_icon_style');

        return icon;
    },

    getOpenCloseIconElement: function() {
        return $(this.treeView.el).find('#' + this.model.get('_id'))
            .find('i.jstree-icon.jstree-ocl').first();
    },

    setOpenCloseIcon: function(recursive=false) {
        var open_icon = this.getOpenIcon();
        var close_icon = this.getCloseIcon();
        var icon_element = this.getOpenCloseIconElement();

        if(this.model.get('nodes').length == 0) {
            icon_element.removeClass(open_icon).removeClass(close_icon);
            return;
        }

        if(icon_element.attr('class') != undefined) {
            var class_list = icon_element.attr('class').split(/\s+/);
            class_list.forEach((class_name) => {
                if(class_name.includes('ipytree-style')) {
                    icon_element.removeClass(class_name);
                }
            });
        }

        if(this.model.get('opened')) {
            icon_element.removeClass(open_icon).addClass(close_icon);
            if(recursive){
                for(var node in this.nodeViewList) {
                    // Recursion in order to make icons on all opened levels correct
                    // Optimal way to do it already, needs to be called on every open
                    // for every child, else it will not have an icon
                    this.nodeViewList[node].setOpenCloseIcon(recursive);
                }
            }
        } else {
            icon_element.removeClass(close_icon).addClass(open_icon);
        }
    },

    onRendered: function() {
        this.nodeViews = new widgets.ViewList(this.addNodeModel, this.removeNodeView, this);
        this.nodeViews.update(this.model.get('nodes'));
        this.nodeViewList = [];

        this.listenTo(this.model, 'change:name', this.handleNameChange);
        this.listenTo(this.model, 'change:opened', this.handleOpenedChange);
        this.listenTo(this.model, 'change:disabled', this.handleDisabledChange);
        this.listenTo(this.model, 'change:selected', this.handleSelectedChange);
        this.listenTo(this.model, 'change:show_icon', this.handleIconChange);
        this.listenTo(this.model, 'change:icon', this.handleIconChange);
        this.listenTo(this.model, 'change:icon_image', this.handleIconChange);
        this.listenTo(this.model, 'change:icon_style', this.handleIconChange);
        this.listenTo(this.model, 'change:open_icon', this.setOpenCloseIcon);
        this.listenTo(this.model, 'change:open_icon_style', this.setOpenCloseIcon);
        this.listenTo(this.model, 'change:close_icon', this.setOpenCloseIcon);
        this.listenTo(this.model, 'change:close_icon_style', this.setOpenCloseIcon);
        this.listenTo(this.model, 'change:nodes', this.handleNodesChange);
        this.listenTo(this.model, 'icons_update', this.setOpenCloseIcon);
        // Update parent, so icon of parent is correct
        // Needs to be called every time a new child is added
        // Else parent icon will not be shown after adding child
        this.parentModel.trigger('icons_update');
    },

    addNodeModel: function(nodeModel) {
        return this.create_child_view(nodeModel, {
            treeView: this.treeView,
            parentModel: this.model
        }).then((view) => {
            this.nodeViewList.push(view);
            return view;
        });
    },

    removeNodeView: function(nodeView) {
        nodeView.remove();
    },

    handleNameChange: function() {
        this.tree.rename_node(this.model.get('_id'), this.model.get('name'));
    },

    handleOpenedChange: function() {
        this.setOpenCloseIcon(true);
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

    remove: function() {
        NodeView.__super__.remove.apply(this, arguments);

        this.nodeViewList.forEach((view) => {
            view.remove();
        });
        this.tree.delete_node(this.model.get('_id'));

        delete this.nodeView;
        this.stopListening(this.model);
    }
});


var TreeModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name: 'TreeModel',
        _view_name: 'TreeView',
        _model_module: 'ipytree',
        _view_module: 'ipytree',
        nodes: [],
        multiple_selection: true,
        drag_and_drop: true,
        animation: 200,
        selected_nodes: [],
        _id: '#'
    })
}, {
    serializers: _.extend({
        nodes: { deserialize: widgets.unpack_models },
        selected_nodes: { deserialize: widgets.unpack_models },
    }, widgets.DOMWidgetModel.serializers)
});

var TreeView = widgets.DOMWidgetView.extend({
    render: function() {
        this.waitTree = new Promise((resolve, reject) => {
            var plugins = ['wholerow']
            if (this.model.get('drag_and_drop')) {
                plugins.push('dnd');
            }
            $(this.el).jstree({
                'core': {
                    check_callback: true,
                    multiple: this.model.get('multiple_selection'),
                    animation: this.model.get('animation'),
                },
                'plugins': plugins
            }).on('ready.jstree', () => {
                this.tree = $(this.el).jstree(true);

                this.nodeViews = new widgets.ViewList(this.addNodeModel, this.removeNodeView, this);
                this.nodeViews.update(this.model.get('nodes'));
                this.listenTo(this.model, 'change:nodes', this.handleNodesChange);

                this.initTreeEventListeners();

                resolve();
            });
        });
    },

    initTreeEventListeners: function() {
        $(this.el).bind(
            "select_node.jstree", (evt, data) => {
                nodesRegistry[data.node.id].set('selected', true);
                nodesRegistry[data.node.id].save_changes();
            }
        ).bind(
            "deselect_node.jstree", (evt, data) => {
                nodesRegistry[data.node.id].set('selected', false);
                nodesRegistry[data.node.id].save_changes();
            }
        ).bind(
            "select_all.jstree", (evt, data) => {
                for(var id in nodesRegistry) {
                    if(this.tree.get_node(id)) {
                        nodesRegistry[id].set('selected', true);
                        nodesRegistry[id].save_changes();
                    }
                }
            }
        ).bind(
            "deselect_all.jstree", (evt, data) => {
                for(var id in nodesRegistry) {
                    if(this.tree.get_node(id)) {
                        nodesRegistry[id].set('selected', false);
                        nodesRegistry[id].save_changes();
                    }
                }
            }
        ).bind(
            "after_open.jstree", (evt, data) => {
                nodesRegistry[data.node.id].set('opened', true);
                nodesRegistry[data.node.id].save_changes();
            }
        ).bind(
            "close_node.jstree", (evt, data) => {
                nodesRegistry[data.node.id].set('opened', false);
                nodesRegistry[data.node.id].save_changes();
            }
        ).bind(
            "changed.jstree", (evt, data) => {
                var selected_nodes = [];
                data.selected.forEach((id) => {
                    selected_nodes.push(nodesRegistry[id]);
                });
                this.model.set('selected_nodes', selected_nodes);
                this.model.save_changes();
            }
        ).bind(
            "move_node.jstree", (evt, data) => {

                var new_parent = ((data.parent == "#") ? this.model : nodesRegistry[data.parent]);
                var old_parent = ((data.old_parent == "#") ? this.model : nodesRegistry[data.old_parent]);

                var np_children = [];  // new children of new_parent
                var op_children = [];  // new children of old_parent

                var update_np_quietly = false;
                // If updating the old_parent's children changes the index of a new ancestor
                // of the moved node, then the change event will propagate through the ancestor
                // and eventually update the new parent.
                // If we then explicitly update the new parent, then it's children will be duplicated
                // on the front end, which is bad.
                // This happens if the moved node was above a new ancestor. For example,
                //   | - node1    ->  | - node2
                //   | - node2        |    - node1
                // root.indexof(node2) changes from 1 to 0, so the change event is propagated to node2


                // Construct the new list of children for the old_parent
                var i = -1;
                data.instance._model.data[data.old_parent].children.slice().forEach((id) => {
                    i++;
                    op_children.push(nodesRegistry[id]);

                    // Once the old index of the moved node has been reached
                    // it is necessary to start searching for the new parent
                    // in order to catch the double change event issue.
                    if (i >= data.old_position) {
                        if (nodesRegistry[id].contains(data.parent)) {
                            update_np_quietly = true;
                        }
                    }
                });

                // Construct the new list of children for the new_parent
                data.instance._model.data[data.parent].children.slice().forEach((id) => {
                    np_children.push(nodesRegistry[id]);
                });

                // Set and propagate the change events
                old_parent.set('nodes', op_children);
                old_parent.save_changes();
                
                new_parent.set('nodes', np_children, {silent: update_np_quietly});
                new_parent.save_changes();
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
        nodeView.remove();
    },

    handleNodesChange: function() {
        this.nodeViews.update(this.model.get('nodes'));
        // If top level nodes are changed, icons disappear
        // So reload them for all visible nodes
        Promise.all(this.nodeViews.views).then(function(views) {
          for(var view in views){
            views[view].setOpenCloseIcon(true);
          }
        });
    },

    remove: function() {
        this.stopListening(this.model);
    },
});

module.exports = {
    NodeModel: NodeModel,
    NodeView: NodeView,
    TreeModel: TreeModel,
    TreeView: TreeView,
};
