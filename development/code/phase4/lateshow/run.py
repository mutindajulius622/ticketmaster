from app import create_app, db
from app.models import Episode, Guest, Appearance

app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'Episode': Episode, 'Guest': Guest, 'Appearance': Appearance}

if __name__ == '__main__':
    app.run(debug=True)
