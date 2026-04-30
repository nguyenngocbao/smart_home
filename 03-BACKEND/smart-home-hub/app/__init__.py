import os
from flask import Flask
from flask_cors import CORS
from .config import config

# ============================================
# Flask App Factory - State Store Architecture
# No Database, No WebSocket
# ============================================

def create_app(env=None):
    env = env or os.getenv("FLASK_ENV", "development")
    app = Flask(__name__, template_folder="../templates", static_folder="../static")
    app.config.from_object(config[env])

    # Extensions
    CORS(app)
    
    from flask import render_template

    @app.route("/")
    def index():
        return render_template("dashboard.html")

    @app.route("/devices")
    def devices():
        return render_template("devices.html")

    @app.route("/automation")
    def automation():
        return render_template("automation.html")

    @app.route("/settings")
    def settings():
        return render_template("settings.html")

    return app
