# Gunicorn configuration file for PeekLink Django backend
# Usage: gunicorn peeklink.wsgi:application --config deployment/gunicorn_config.py

import multiprocessing
import os

# Server socket
bind = "127.0.0.1:8000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 60
keepalive = 5
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = "/var/log/gunicorn/peeklink_access.log"
errorlog = "/var/log/gunicorn/peeklink_error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "peeklink_gunicorn"

# Server mechanics
daemon = False
pidfile = "/var/run/gunicorn/peeklink.pid"
umask = 0
user = "www-data"
group = "www-data"
tmp_upload_dir = None

# SSL (if using HTTPS)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"

# Preload app for better performance
preload_app = True

# Graceful timeout for worker restart
graceful_timeout = 30

# Worker temp directory
worker_tmp_dir = "/dev/shm"

def when_ready(server):
    """Called just after the server is started."""
    server.log.info("PeekLink Gunicorn server is ready. Spawning workers")

def on_exit(server):
    """Called just before exiting Gunicorn."""
    server.log.info("PeekLink Gunicorn server is shutting down")

def worker_int(worker):
    """Called when a worker receives INT or QUIT signal."""
    worker.log.info("Worker received INT or QUIT signal")

def pre_fork(server, worker):
    """Called just before a worker is forked."""
    pass

def post_fork(server, worker):
    """Called just after a worker has been forked."""
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def pre_exec(server):
    """Called just before a new master process is forked."""
    server.log.info("Forking new master process")

def when_ready(server):
    """Called just after the server is started."""
    server.log.info("Server is ready. Spawning workers")

def worker_abort(worker):
    """Called when a worker times out."""
    worker.log.info("Worker timeout (pid: %s)", worker.pid)

