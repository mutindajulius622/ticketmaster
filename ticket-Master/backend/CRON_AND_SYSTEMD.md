# Running the expired reservation cleaner periodically

A small script is provided at `backend/tools/release_expired_reservations.py` which releases expired `Seat` reservations by setting their `status` back to `available`.

You can run this script periodically using `cron` or a systemd timer.

## Cron example (every minute)

Edit your crontab with `crontab -e` and add:

```cron
* * * * * cd /home/palmer/ticket-Master/backend && . .venv/bin/activate && python tools/release_expired_reservations.py >> /var/log/ticketmaster/release_expired.log 2>&1
```

## systemd service + timer example

Create `/etc/systemd/system/tm-release-expired.service`:

```
[Unit]
Description=TicketMaster - Release expired seat reservations

[Service]
Type=oneshot
WorkingDirectory=/home/palmer/ticket-Master/backend
ExecStart=/home/palmer/ticket-Master/backend/.venv/bin/python tools/release_expired_reservations.py
User=www-data
```

Create `/etc/systemd/system/tm-release-expired.timer`:

```
[Unit]
Description=Run release expired reservations every minute

[Timer]
OnCalendar=*-*-* *:*:00/60
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start the timer:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tm-release-expired.timer
```

Logs will be visible via `journalctl -u tm-release-expired.service`.

## Notes

- Ensure the virtualenv path and working directory match your deployment.
- Adjust `User=` to an appropriate system user.
- Running every minute is aggressive; consider every 30s-2min depending on load and reservation hold length.
