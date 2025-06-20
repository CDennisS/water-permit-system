from flask import render_template_string
import os

class LazyTemplateLoader:
    def __init__(self):
        self.template_cache = {}
    
    def load_template(self, template_name):
        """Load templates only when needed"""
        if template_name not in self.template_cache:
            template_path = f"templates/{template_name}"
            if os.path.exists(template_path):
                with open(template_path, 'r') as f:
                    self.template_cache[template_name] = f.read()
        
        return self.template_cache.get(template_name)
    
    def render_lazy_template(self, template_name, **context):
        """Render template with lazy loading"""
        template_content = self.load_template(template_name)
        return render_template_string(template_content, **context)
