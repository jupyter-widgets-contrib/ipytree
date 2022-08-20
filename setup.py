from __future__ import print_function
from setuptools import setup, find_packages
import os
from distutils import log

from jupyter_packaging import (
    create_cmdclass, install_npm, ensure_targets,
    combine_commands, get_version, skip_if_exists
)

name = 'ipytree'

here = os.path.dirname(os.path.abspath(__file__))
long_description = 'A Tree Widget using jsTree'

log.set_verbosity(log.DEBUG)
log.info('setup.py entered')
log.info('$PATH=%s' % os.environ['PATH'])

# Get ipytree version
version = get_version(os.path.join(name, '_version.py'))

js_dir = os.path.join(here, 'js')

# Representative files that should exist after a successful build
jstargets = [
    os.path.join('ipytree/nbextension', 'index.js'),
    os.path.join('ipytree/labextension', 'package.json'),
]

data_files_spec = [
    ('share/jupyter/nbextensions/ipytree', 'ipytree/nbextension', '**'),
    ('share/jupyter/labextensions/ipytree', 'ipytree/labextension', "**"),
    ('etc/jupyter/nbconfig/notebook.d', '.', 'ipytree.json'),
]

cmdclass = create_cmdclass('jsdeps', data_files_spec=data_files_spec)
js_command = combine_commands(
    install_npm(js_dir, npm=["yarn"], build_cmd='build'), ensure_targets(jstargets),
)

is_repo = os.path.exists(os.path.join(here, '.git'))
if is_repo:
    cmdclass['jsdeps'] = js_command
else:
    cmdclass['jsdeps'] = skip_if_exists(jstargets, js_command)

setup_args = {
    'name': name,
    'version': version,
    'license': 'MIT License',
    'description': 'A Tree Widget using jsTree',
    'long_description': long_description,
    'include_package_data': True,
    'install_requires': [
        'ipywidgets>=7.5.0,<9',
    ],
    'packages': find_packages(),
    'zip_safe': False,
    'cmdclass': cmdclass,
    'author': 'Martin Renou',
    'author_email': 'martin.renou@gmail.com',
    'url': 'https://github.com/martinRenou/ipytree',
    'keywords': [
        'ipython',
        'jupyter',
        'widgets',
    ],
    'classifiers': [
        'Development Status :: 4 - Beta',
        'Framework :: IPython',
        'Intended Audience :: Developers',
        'Intended Audience :: Science/Research',
        'Topic :: Multimedia :: Graphics',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
    ],
}

setup(**setup_args)
