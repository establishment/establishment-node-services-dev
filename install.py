import os
import sys
import subprocess

modules = {
    "establishment-node-core": "establishment-node-core",
    "establishment-node-service-core": "establishment-node-service-core",
    "establishment-nodews": "establishment-nodews",
    "establishment-nodews-meta": "establishment-nodews-meta",
    "establishment-nodews-proxy": "establishment-nodews-proxy",
    "establishment-node-service-emulator": "establishment-node-service-emulator",
    "launchers": None
}

root = os.path.dirname(os.path.realpath(__file__))


def build_mocking_config(modules):
    global root
    config = {}
    for local_module_name, global_module_name in modules.items():
        if global_module_name:
            config[global_module_name] = os.path.join(root, local_module_name)
    return config


def npm_install(module):
    print("Installing module " + module + " ... ")
    global root
    path = os.path.join(root, module)
    subprocess.call("cd " + path + "; npm install", shell=True)


def get_dirs_in(path):
    return [f for f in os.listdir(path) if os.path.isdir(os.path.join(path, f))]


def npm_mock(module, mocking_config):
    print("Mocking module " + module + " ... ")
    global root
    path = os.path.join(os.path.join(root, module), "node_modules")
    node_modules = get_dirs_in(path)
    for dep_module in node_modules:
        if dep_module in mocking_config:
            dep_module_path = os.path.join(path, dep_module)
            if os.path.islink(dep_module_path):
                os.unlink(dep_module_path)
            else:
                subprocess.call("rm -rf " + dep_module_path + " > /dev/null", shell=True)
            os.symlink(mocking_config[dep_module], dep_module_path)


def clean_module(module):
    print("Cleaning module " + module + " ... ")
    global root
    node_modules = os.path.join(os.path.join(root, module), "node_modules")
    subprocess.call("rm -rf " + node_modules, shell=True)


def install():
    print ("Installing module dependencies ... ")
    for local_module_name in modules:
        npm_install(local_module_name)


def mock():
    print("Setting dependencies mocking ... ")
    mocking_config = build_mocking_config(modules)

    for local_module_name in modules:
        npm_mock(local_module_name, mocking_config)


def clean():
    print("Cleaning ... ")
    for local_module_name in modules:
        clean_module(local_module_name)

valid_command = False
if len(sys.argv) == 2:
    if sys.argv[1] == "install":
        valid_command = True
        install()
    elif sys.argv[1] == "mock":
        valid_command = True
        mock()
    elif sys.argv[1] == "clean":
        valid_command = True
        clean()

if not valid_command:
    print("Invalid command!")
    exit(2)
