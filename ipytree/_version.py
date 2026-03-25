try:
    from importlib.metadata import version, PackageNotFoundError

    try:
        __version__ = version("ipytree")
    except PackageNotFoundError:
        __version__ = "0.0.0"
except ImportError:
    __version__ = "0.0.0"

version_info = tuple(int(x) for x in __version__.split(".")[:3])
module_version = "^" + ".".join(__version__.split(".")[:2])
