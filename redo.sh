pip install -e .
jupyter nbextension install --py --symlink --sys-prefix ipytree
jupyter nbextension enable ipytree --py --sys-prefix
jupyter notebook
