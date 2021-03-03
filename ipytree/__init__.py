from ._version import version_info, __version__

from .tree import *

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'nbextension',
        'dest': 'ipytree',
        'require': 'ipytree/extension'
    }]
