from ipywidgets import register, Widget, DOMWidget, widget_serialization
from traitlets import (
    default, TraitError,
    Bool, Int, Unicode, Enum, Tuple, Instance
)
import uuid
from ._version import module_version


def id_gen():
    return uuid.uuid4().urn[9:]


@register
class Node(Widget):
    """ The node widget """
    _view_name = Unicode('NodeView').tag(sync=True)
    _model_name = Unicode('NodeModel').tag(sync=True)
    _view_module = Unicode('ipytree').tag(sync=True)
    _model_module = Unicode('ipytree').tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)

    _style_values = [
        "warning", "danger", "success", "info", "default"
    ]

    name = Unicode("Node").tag(sync=True)
    opened = Bool(True).tag(sync=True)
    disabled = Bool(False).tag(sync=True)
    selected = Bool(False).tag(sync=True)

    show_icon = Bool(True).tag(sync=True)
    icon = Unicode("folder").tag(sync=True)
    icon_style = Enum(values=_style_values, default_value="default").tag(sync=True)
    icon_image = Unicode("").tag(sync=True)

    open_icon = Unicode("plus").tag(sync=True)
    open_icon_style = Enum(values=_style_values, default_value="default").tag(sync=True)

    close_icon = Unicode("minus").tag(sync=True)
    close_icon_style = Enum(values=_style_values, default_value="default").tag(sync=True)

    nodes = Tuple().tag(trait=Instance(Widget),
        sync=True, **widget_serialization)

    _id = Unicode(read_only=True).tag(sync=True)

    def __init__(self, name="Node", nodes=[], **kwargs):
        super(Node, self).__init__(**kwargs)

        self.name = name
        self.nodes = nodes

    @default('_id')
    def _default_id(self):
        return id_gen()

    def add_node(self, node, position=None):
        if not isinstance(node, Node):
            raise TraitError('The added node must be a Node instance')

        nodes = list(self.nodes)
        if position is None or position > len(nodes):
            position = len(nodes)
        nodes.insert(position, node)
        self.nodes = tuple(nodes)

    def remove_node(self, node):
        if node not in self.nodes:
            raise RuntimeError(
                '{} is not a children of {}'.format(node.name, self.name)
            )
        self.nodes = tuple([n for n in self.nodes if n._id != node._id])


@register
class Tree(DOMWidget):
    """ The base Tree widget """
    _view_name = Unicode('TreeView').tag(sync=True)
    _model_name = Unicode('TreeModel').tag(sync=True)
    _view_module = Unicode('ipytree').tag(sync=True)
    _model_module = Unicode('ipytree').tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)

    nodes = Tuple().tag(trait=Instance(Node), sync=True, **widget_serialization)
    multiple_selection = Bool(True, read_only=True).tag(sync=True)
    animation = Int(200, read_only=True).tag(sync=True)
    selected_nodes = Tuple(read_only=True).tag(trait=Instance(Node),sync=True, **widget_serialization)

    _id = Unicode('#', read_only=True).tag(sync=True)

    def __init__(
            self, nodes=[], multiple_selection=True, animation=200,
            **kwargs):
        super(Tree, self).__init__(**kwargs)

        self.nodes = nodes
        self.set_trait('multiple_selection', multiple_selection)
        self.set_trait('animation', animation)

    def add_node(self, node, position=None):
        if not isinstance(node, Node):
            raise TraitError('The added node must be a Node instance')

        nodes = list(self.nodes)
        if position is None or position > len(nodes):
            position = len(nodes)
        nodes.insert(position, node)
        self.nodes = tuple(nodes)

    def remove_node(self, node):
        if node not in self.nodes:
            raise RuntimeError(
                '{} is not a children of the tree'.format(node.name)
            )
        self.nodes = tuple([n for n in self.nodes if n._id != node._id])
