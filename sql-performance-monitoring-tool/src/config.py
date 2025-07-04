import ruamel.yaml

def load_config():
    with open('config.yaml', 'r') as f:
        yaml = ruamel.yaml.YAML()
        return yaml.load(f)