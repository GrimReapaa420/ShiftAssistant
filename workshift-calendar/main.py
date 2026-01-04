from app import app
import routes
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    
    if os.environ.get("USE_GUNICORN", "").lower() == "true":
        import subprocess
        import sys
        subprocess.run([
            sys.executable, "-m", "gunicorn",
            "--bind", f"0.0.0.0:{port}",
            "--workers", "2",
            "--reuse-port",
            "app:app"
        ])
    else:
        app.run(host="0.0.0.0", port=port, debug=True)
