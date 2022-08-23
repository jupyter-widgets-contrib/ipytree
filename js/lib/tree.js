var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var $ = require('jquery');
require('./theme/style.css');
require('jstree');

var nodesRegistry = {};

export class NodeModel extends widgets.WidgetModel {
    defaults() {
        return {
            ...super.defaults(),
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
        };
    }

    initialize() {
        super.initialize(arguments);

        nodesRegistry[this.get('_id')] = this;
    }
}

NodeModel.serializers = {
    ...widgets.WidgetModel.serializers,
    nodes: { deserialize: widgets.unpack_models },
};

export class NodeView extends widgets.WidgetView {
    initialize() {
        super.initialize(arguments);

        this.parentModel = this.options.parentModel;
        this.treeView = this.options.treeView;

        this.treeView.waitTree.then(() => {
            this.tree = $(this.treeView.el).jstree(true);
            this.renderNode();
        });
    }

    renderNode() {
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
    }

    getIcon() {
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
    }

    getOpenIcon() {
        var icon = this.model.get('open_icon');
        icon = 'fa fa-' + icon + ' ipytree-style-' + this.model.get('open_icon_style');

        return icon;
    }

    getCloseIcon() {
        var icon = this.model.get('close_icon');
        icon = 'fa fa-' + icon + ' ipytree-style-' + this.model.get('close_icon_style');

        return icon;
    }

    getOpenCloseIconElement() {
        return $(this.treeView.el).find('#' + this.model.get('_id'))
            .find('i.jstree-icon.jstree-ocl').first();
    }

    setOpenCloseIcon(recursive=false) {
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
    }

    onRendered() {
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
    }

    addNodeModel(nodeModel) {
        return this.create_child_view(nodeModel, {
            treeView: this.treeView,
            parentModel: this.model
        }).then((view) => {
            this.nodeViewList.push(view);
            return view;
        });
    }

    removeNodeView(nodeView) {
        nodeView.remove();
    }

    handleNameChange() {
        this.tree.rename_node(this.model.get('_id'), this.model.get('name'));
    }

    handleOpenedChange() {
        this.setOpenCloseIcon(true);
        if(this.model.get('opened')) {
            this.tree.open_node(this.model.get('_id'));
        } else {
            this.tree.close_node(this.model.get('_id'));
        }
    }

    handleDisabledChange() {
        if(this.model.get('disabled')) {
            this.tree.disable_node(this.model.get('_id'));
        } else {
            this.tree.enable_node(this.model.get('_id'));
        }
    }

    handleSelectedChange() {
        if(this.model.get('selected')) {
            this.tree.select_node(this.model.get('_id'));
        } else {
            this.tree.deselect_node(this.model.get('_id'));
        }
    }

    handleIconChange() {
        this.tree.set_icon(this.model.get('_id'), this.getIcon());
    }

    handleNodesChange() {
        this.nodeViews.update(this.model.get('nodes'));
    }

    remove() {
        NodeView.__super__.remove.apply(this, arguments);

        this.nodeViewList.forEach((view) => {
            view.remove();
        });
        this.tree.delete_node(this.model.get('_id'));

        delete this.nodeView;
        this.stopListening(this.model);
    }
};


export class TreeModel extends widgets.DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name: 'TreeModel',
            _view_name: 'TreeView',
            _model_module: 'ipytree',
            _view_module: 'ipytree',
            nodes: [],
            multiple_selection: true,
            animation: 200,
            selected_nodes: [],
            _id: '#'
        }
    }
}

TreeModel.serializers = {
    ...widgets.DOMWidgetModel.serializers,
    nodes: { deserialize: widgets.unpack_models },
    selected_nodes: { deserialize: widgets.unpack_models },
};

export class TreeView extends widgets.DOMWidgetView {
    render() {
        this.waitTree = new Promise((resolve, reject) => {
            $(this.el).jstree({
                'core': {
                    check_callback: true,
                    multiple: this.model.get('multiple_selection'),
                    animation: this.model.get('animation'),
                },
                'plugins': [
                    'wholerow'
                ]
            }).on('ready.jstree', () => {
                this.tree = $(this.el).jstree(true);

                this.nodeViews = new widgets.ViewList(this.addNodeModel, this.removeNodeView, this);
                this.nodeViews.update(this.model.get('nodes'));
                this.listenTo(this.model, 'change:nodes', this.handleNodesChange);

                this.initTreeEventListeners();

                resolve();
            });
        });
    }

    initTreeEventListeners() {
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
        );
    }

    addNodeModel(nodeModel) {
        return this.create_child_view(nodeModel, {
            treeView: this,
            parentModel: this.model,
        });
    }

    removeNodeView(nodeView) {
        nodeView.remove();
    }

    handleNodesChange() {
        this.nodeViews.update(this.model.get('nodes'));
        // If top level nodes are changed, icons disappear
        // So reload them for all visible nodes
        Promise.all(this.nodeViews.views).then(function(views) {
          for(var view in views){
            views[view].setOpenCloseIcon(true);
          }
        });
    }

    remove() {
        this.stopListening(this.model);
    }
}
