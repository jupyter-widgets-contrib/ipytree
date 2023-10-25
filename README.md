ipytree
=======

A Tree Widget using Jupyter-widgets protocol and [jsTree](https://www.jstree.com/)

Try it out using binder: [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/QuantStack/ipytree/stable?filepath=examples)

![Tree Screencast](./ipytree.gif)

Installation
------------

With conda:

```
$ conda install -c conda-forge ipytree
```

With pip:

```
$ pip install ipytree
```

If you use JupyterLab<=2:
```
$ jupyter labextension install @jupyter-widgets/jupyterlab-manager ipytree
```

If you have notebook 5.2 or below, you also need to execute:
```
$ jupyter nbextension enable --py --sys-prefix ipytree
```

For a development installation (requires yarn and JupyterLab 3),
```
$ git clone https://github.com/QuantStack/ipytree.git
$ cd ipytree
$ pip install jupyter
$ pip install "jupyterlab>=3.0.0,<4.0.0"
$ pip install -e .
$ jupyter nbextension install --py --symlink --sys-prefix ipytree
$ jupyter nbextension enable --py --sys-prefix ipytree
```
