from app import create_app, db

app = create_app()


@app.shell_context_processor
def make_shell_context():
    """Create shell context for Flask CLI"""
    from app.models import User, Event, Ticket, TicketType, Payment, Review
    return {
        'db': db,
        'User': User,
        'Event': Event,
        'Ticket': Ticket,
        'TicketType': TicketType,
        'Payment': Payment,
        'Review': Review
    }


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)