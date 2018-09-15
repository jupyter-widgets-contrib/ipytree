from ipywidgets import register, Widget, DOMWidget, widget_serialization
from traitlets import Unicode, Enum, Tuple, Instance, default, TraitError
import uuid


def id_gen():
    return uuid.uuid4().urn[9:]


@register
class Node(Widget):
    """ The node widget """
    _view_name = Unicode('NodeView').tag(sync=True)
    _model_name = Unicode('NodeModel').tag(sync=True)
    _view_module = Unicode('ipytree').tag(sync=True)
    _model_module = Unicode('ipytree').tag(sync=True)
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    _model_module_version = Unicode('^0.1.0').tag(sync=True)

    name = Unicode("Node").tag(sync=True)
    icon = Unicode("file").tag(sync=True)
    icon = Unicode("folder").tag(sync=True)
    icon_color = Enum([
        "navy", "blue", "aqua", "teal", "olive", "green", "lime", "yellow",
        "orange", "red", "fuchsia", "purple", "maroon", "white",
        "silver", "gray", "black"
    ], default_value="silver").tag(sync=True)
    nodes = Tuple(trait=Instance(Widget)).tag(sync=True, **widget_serialization)

    _id = Unicode(read_only=True).tag(sync=True)

    @default('_id')
    def _default_id(self):
        return id_gen()

    def add_node(self, node, position="last"):
        # TODO position ?
        if not isinstance(node, Node):
            raise TraitError('The added node must be a Node instance')
        self.nodes = tuple([n for n in self.nodes] + [node])

    def remove_node(self):
        pass


@register
class Tree(DOMWidget):
    """ The base Tree widget """
    _view_name = Unicode('TreeView').tag(sync=True)
    _model_name = Unicode('TreeModel').tag(sync=True)
    _view_module = Unicode('ipytree').tag(sync=True)
    _model_module = Unicode('ipytree').tag(sync=True)
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    _model_module_version = Unicode('^0.1.0').tag(sync=True)

    nodes = Tuple(trait=Instance(Node)).tag(sync=True, **widget_serialization)

    _id = Unicode('#', read_only=True).tag(sync=True)

    def add_node(self, node, position="last"):
        # TODO position ?
        if not isinstance(node, Node):
            raise TraitError('The added node must be a Node instance')
        self.nodes = tuple([n for n in self.nodes] + [node])

    def remove_node(self):
        pass
