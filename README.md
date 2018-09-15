ipytree
=======

A Tree Widget using Jupyter-widgets protocol and [jsTree](https://www.jstree.com/)

Installation
------------

For a development installation (requires npm),

    $ git clone https://github.com/martinRenou/ipytree.git
    $ cd ipytree
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --sys-prefix ipytree
    $ jupyter nbextension enable --py --sys-prefix ipytree
