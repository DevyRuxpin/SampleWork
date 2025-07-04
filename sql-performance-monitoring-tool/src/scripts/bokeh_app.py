from bokeh.io import curdoc
from visualizers.performance_visualizer import PerformanceVisualizer
import yaml

def load_config():
    with open('config.yaml', 'r') as f:
        return yaml.safe_load(f)

config = load_config()
visualizer = PerformanceVisualizer(config['visualization'])

curdoc().add_root(visualizer.layout)