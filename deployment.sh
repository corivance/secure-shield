#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# SecureShield — Production Deployment Script
# ═══════════════════════════════════════════════════════════════════════════════
#
# Interactive setup for deploying SecureShield on a fresh server.
#   1. Checks prerequisites (Node, Docker, npm)
#   2. Installs dependencies
#   3. Builds frontend for production
#   4. Starts Mongo + Redis via Docker
#   5. Seeds the database
#   6. Runs backend + worker + serves frontend via nginx/serve
#
# Usage:
#   bash deployment.sh              # Interactive (asks for ports)
#   FRONTEND_PORT=80 bash deployment.sh   # Non-interactive
#
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

STACK_NAME="secureshield"
GEN_STACK="$ROOT/.stack.generated.yml"
MONGO_BASE=27017
REDIS_BASE=6379
DEPLOY_LOG="$ROOT/deployment.log"

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}▶${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*"; }
err()   { echo -e "${RED}✗${NC} $*"; exit 1; }

# ═══════════════════════════════════════════════════════════════════════════════
# § 1. PREREQUISITES
# ═══════════════════════════════════════════════════════════════════════════════

check_prereqs() {
  info "Checking prerequisites..."

  # Node.js
  if ! command -v node &>/dev/null; then
    err "Node.js not found. Install Node.js 20+ from https://nodejs.org/"
  fi
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -lt 20 ]; then
    err "Node.js $NODE_VER found. Version 20+ required."
  fi
  ok "Node.js $(node -v)"

  # npm
  if ! command -v npm &>/dev/null; then
    err "npm not found."
  fi
  ok "npm $(npm -v)"

  # Docker
  if ! command -v docker &>/dev/null; then
    warn "Docker not found. Installing..."
    install_docker
  fi

  # Docker daemon — handle headless servers.
  if ! docker info &>/dev/null 2>&1; then
    warn "Docker daemon not responding. Attempting to start..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS — Docker Desktop.
      open -a Docker 2>/dev/null || true
      info "Waiting for Docker Desktop to start..."
      local attempts=0
      until docker info &>/dev/null 2>&1; do
        sleep 3
        attempts=$((attempts + 1))
        if [ "$attempts" -ge 20 ]; then
          err "Docker Desktop failed to start. Open it manually and re-run."
        fi
      done
    else
      # Linux server — try systemctl, then service, then dockerd directly.
      if command -v systemctl &>/dev/null; then
        sudo systemctl start docker 2>/dev/null || true
        sudo systemctl enable docker 2>/dev/null || true
      elif command -v service &>/dev/null; then
        sudo service docker start 2>/dev/null || true
      elif [ -f /etc/init.d/docker ]; then
        sudo /etc/init.d/docker start 2>/dev/null || true
      else
        # Last resort — start dockerd in background.
        if command -v dockerd &>/dev/null; then
          sudo dockerd &>/tmp/dockerd.log &
          disown
        fi
      fi

      # Wait for daemon.
      info "Waiting for Docker daemon..."
      local attempts=0
      until docker info &>/dev/null 2>&1; do
        sleep 2
        attempts=$((attempts + 1))
        if [ "$attempts" -ge 15 ]; then
          err "Docker daemon failed to start. Check: sudo journalctl -u docker.service -n 50"
        fi
      done
    fi
  fi
  ok "Docker $(docker --version | awk '{print $3}' | tr -d ',')"

  # Docker Compose (plugin or standalone).
  if docker compose version &>/dev/null 2>&1; then
    ok "Docker Compose $(docker compose version --short 2>/dev/null || echo 'available')"
  elif command -v docker-compose &>/dev/null; then
    ok "Docker Compose (standalone) available"
  else
    warn "Docker Compose not found. Installing docker-compose-plugin..."
    install_docker_compose
  fi

  # Docker Swarm — init if needed (for stack deploy).
  if ! docker info 2>/dev/null | grep -qi 'Swarm: active'; then
    info "Initializing Docker Swarm..."
    docker swarm init --advertise-addr 127.0.0.1 >/dev/null 2>&1 \
      || docker swarm init >/dev/null 2>&1 || true
  fi
  ok "Docker Swarm active"

  echo ""
}

install_docker() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS — install Docker Desktop via Homebrew.
    if command -v brew &>/dev/null; then
      info "Installing Docker Desktop via Homebrew..."
      brew install --cask docker
      open -a Docker
      info "Waiting for Docker Desktop to start..."
      sleep 10
      until docker info &>/dev/null; do sleep 3; done
    else
      err "Install Docker Desktop from https://docker.com/products/docker-desktop/ or install Homebrew first: https://brew.sh"
    fi
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Detect distro and install Docker Engine (not Docker Desktop).
    if [ -f /etc/os-release ]; then
      . /etc/os-release
      DISTRO="${ID:-unknown}"
    else
      DISTRO="unknown"
    fi

    case "$DISTRO" in
      ubuntu|debian)
        info "Installing Docker Engine via apt..."
        sudo apt-get update -qq
        sudo apt-get install -y -qq ca-certificates curl gnupg
        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null || true
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update -qq
        sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
        ;;
      centos|rhel|almalinux|rocky|amzn)
        info "Installing Docker Engine via yum..."
        sudo yum install -y -q yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo 2>/dev/null || true
        sudo yum install -y -q docker-ce docker-ce-cli containerd.io docker-compose-plugin
        ;;
      fedora)
        info "Installing Docker Engine via dnf..."
        sudo dnf install -y -q docker-ce docker-ce-cli containerd.io docker-compose-plugin
        ;;
      arch|manjaro)
        info "Installing Docker via pacman..."
        sudo pacman -S --noconfirm docker docker-compose
        ;;
      alpine)
        info "Installing Docker via apk..."
        sudo apk add docker docker-compose
        ;;
      *)
        # Fallback — try curl install script (official Docker convenience script).
        warn "Unknown distro ($DISTRO). Trying official Docker install script..."
        curl -fsSL https://get.docker.com | sudo sh
        ;;
    esac

    # Enable and start Docker service.
    if command -v systemctl &>/dev/null; then
      sudo systemctl enable docker 2>/dev/null || true
      sudo systemctl start docker 2>/dev/null || true
    elif command -v service &>/dev/null; then
      sudo service docker start 2>/dev/null || true
    fi

    # Add current user to docker group (avoids needing sudo for docker commands).
    sudo usermod -aG docker "$USER" 2>/dev/null || true
    info "Added $USER to docker group. You may need to log out and back in for group changes to take effect."

  else
    err "Unsupported OS ($OSTYPE). Install Docker manually: https://docs.docker.com/engine/install/"
  fi

  # Verify installation.
  if ! command -v docker &>/dev/null; then
    err "Docker installation failed. Install manually: https://docs.docker.com/engine/install/"
  fi
  ok "Docker installed successfully"
}

install_docker_compose() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # Docker Desktop on macOS includes compose plugin.
    return 0
  fi

  # Linux — install docker-compose-plugin via the same package manager.
  if command -v apt-get &>/dev/null; then
    sudo apt-get install -y -qq docker-compose-plugin
  elif command -v yum &>/dev/null; then
    sudo yum install -y -q docker-compose-plugin
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y -q docker-compose-plugin
  elif command -v pacman &>/dev/null; then
    sudo pacman -S --noconfirm docker-compose
  elif command -v apk &>/dev/null; then
    sudo apk add docker-compose
  else
    # Standalone binary fallback.
    info "Installing docker-compose standalone binary..."
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
      -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
  fi

  if docker compose version &>/dev/null 2>&1 || docker-compose --version &>/dev/null 2>&1; then
    ok "Docker Compose installed"
  else
    warn "Docker Compose installation may have failed. stack deploy may not work."
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# § 2. PORT SELECTION
# ═══════════════════════════════════════════════════════════════════════════════

port_open() { (echo > "/dev/tcp/127.0.0.1/$1") >/dev/null 2>&1; }

ask_port() {
  local prompt=$1 default=$2 var=$3
  if [ -n "${!var:-}" ]; then
    echo -e "${CYAN}▶${NC} $prompt: ${!var} (from env)"
    return
  fi
  read -rp "$(echo -e "${CYAN}▶${NC} $prompt [$default]: ")" val
  val="${val:-$default}"
  eval "$var=\"$val\""
}

select_ports() {
  echo -e "${BOLD}Port Configuration${NC}"
  echo "Choose which ports to use. The frontend serves the production build."
  echo ""

  ask_port "Frontend port (serves the built app)" "80" FRONTEND_PORT
  ask_port "Backend API port" "4000" BACKEND_PORT
  ask_port "MongoDB port" "27017" MONGO_PORT
  ask_port "Redis port" "6379" REDIS_PORT

  # Validate no conflicts.
  for p in "$FRONTEND_PORT" "$BACKEND_PORT" "$MONGO_PORT" "$REDIS_PORT"; do
    if [ "$p" -lt 1 ] || [ "$p" -gt 65535 ]; then
      err "Invalid port: $p"
    fi
  done

  echo ""
  echo -e "${BOLD}Selected ports:${NC}"
  echo "  Frontend → :$FRONTEND_PORT"
  echo "  Backend  → :$BACKEND_PORT"
  echo "  MongoDB  → :$MONGO_PORT"
  echo "  Redis    → :$REDIS_PORT"
  echo ""

  read -rp "$(echo -e "${CYAN}▶${NC} Proceed with these ports? [Y/n]: ")" confirm
  if [[ "${confirm,,}" == "n" ]]; then
    err "Aborted by user."
  fi
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════════
# § 3. INFRASTRUCTURE (Docker)
# ═══════════════════════════════════════════════════════════════════════════════

# Published host ports currently held by our own running containers.
OUR_PORTS="$(docker ps --format '{{.Names}} {{.Ports}}' 2>/dev/null \
  | grep "^${STACK_NAME}_" | grep -oE ':[0-9]+->' | tr -d ':->-' | sort -u || true)"
is_ours() { printf '%s\n' "$OUR_PORTS" | grep -qx "$1"; }

pick_port() {
  local p=$1
  while port_open "$p" && ! is_ours "$p"; do p=$((p + 1)); done
  echo "$p"
}

wait_for_port() {
  local name=$1 port=$2 timeout=${3:-60} elapsed=0
  info "Waiting for $name on :$port..."
  while ! port_open "$port"; do
    sleep 1
    elapsed=$((elapsed + 1))
    if [ "$elapsed" -ge "$timeout" ]; then
      err "$name did not start within ${timeout}s"
    fi
  done
  ok "$name is up"
}

gen_stack() {
  local mp=$1 rp=$2
  cat > "$GEN_STACK" <<EOF
version: "3.8"
services:
  mongo:
    image: mongo:7
    ports:
      - { target: 27017, published: ${mp}, protocol: tcp, mode: host }
    volumes:
      - mongo_data:/data/db
    deploy:
      replicas: 1
      restart_policy: { condition: any }
  redis:
    image: redis:7-alpine
    ports:
      - { target: 6379, published: ${rp}, protocol: tcp, mode: host }
    deploy:
      replicas: 1
      restart_policy: { condition: any }
volumes:
  mongo_data:
EOF
}

start_infra() {
  info "Starting infrastructure..."

  # Remove stale containers.
  for stale in "${STACK_NAME}-mongo" "${STACK_NAME}-redis"; do
    if docker ps -aq -f "name=^${stale}$" | grep -q .; then
      docker rm -f "$stale" >/dev/null 2>&1 || true
    fi
  done

  # Resolve actual ports (skip occupied ones).
  MONGO_PORT=$(pick_port "$MONGO_PORT")
  REDIS_PORT=$(pick_port "$REDIS_PORT")

  info "Deploying stack (mongo :$MONGO_PORT, redis :$REDIS_PORT)..."
  gen_stack "$MONGO_PORT" "$REDIS_PORT"
  docker stack deploy -c "$GEN_STACK" "$STACK_NAME" --detach=false 2>/dev/null \
    || docker stack deploy -c "$GEN_STACK" "$STACK_NAME"

  wait_for_port "MongoDB" "$MONGO_PORT" 30
  wait_for_port "Redis" "$REDIS_PORT" 30

  ok "Infrastructure ready"
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════════
# § 4. BACKEND SETUP
# ═══════════════════════════════════════════════════════════════════════════════

ensure_env() {
  local key=$1 val=$2 file=$3
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i '' "s|^${key}=.*|${key}=${val}|" "$file" 2>/dev/null \
      || sed -i "s|^${key}=.*|${key}=${val}|" "$file"
  else
    printf '%s=%s\n' "$key" "$val" >> "$file"
  fi
}

generate_jwt_secret() {
  if command -v openssl &>/dev/null; then
    openssl rand -hex 32
  elif command -v node &>/dev/null; then
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  else
    head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n' | head -c 64
  fi
}

setup_backend() {
  info "Setting up backend..."

  # Create .env if missing.
  if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
  fi

  # Generate secure JWT secrets if still default.
  JWT_SECRET_VAL=$(generate_jwt_secret)
  JWT_REFRESH_VAL=$(generate_jwt_secret)

  # Configure backend env.
  ensure_env "PORT" "$BACKEND_PORT" backend/.env
  ensure_env "NODE_ENV" "production" backend/.env
  ensure_env "MONGODB_URI" "mongodb://localhost:${MONGO_PORT}/secureshield" backend/.env
  ensure_env "REDIS_URL" "redis://localhost:${REDIS_PORT}" backend/.env
  ensure_env "JWT_SECRET" "$JWT_SECRET_VAL" backend/.env
  ensure_env "JWT_REFRESH_SECRET" "$JWT_REFRESH_VAL" backend/.env

  ok "backend/.env configured"

  # Install dependencies.
  info "Installing backend dependencies..."
  (cd backend && npm install --no-audit --no-fund --omit=dev 2>&1 | tail -1)
  ok "Backend dependencies installed"

  # Seed database.
  info "Seeding database..."
  (cd backend && npm run seed 2>&1 | tail -3)
  ok "Database seeded"
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════════
# § 5. FRONTEND BUILD
# ═══════════════════════════════════════════════════════════════════════════════

build_frontend() {
  info "Building frontend for production..."

  # Install dependencies.
  info "Installing frontend dependencies..."
  (cd frontend && npm install --no-audit --no-fund 2>&1 | tail -1)

  # Build.
  info "Running vite build..."
  (cd frontend && npm run build 2>&1 | tail -5)
  ok "Frontend built to frontend/dist/"
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════════
# § 6. STATIC FILE SERVER
# ═══════════════════════════════════════════════════════════════════════════════

start_frontend_server() {
  info "Starting production frontend server..."

  DIST_DIR="$ROOT/frontend/dist"

  if [ ! -d "$DIST_DIR" ]; then
    err "frontend/dist/ not found. Build first."
  fi

  # Check if 'serve' is available, otherwise use npx.
  if command -v serve &>/dev/null; then
    SERVE_CMD="serve"
  else
    info "Installing 'serve' globally..."
    npm install -g serve 2>/dev/null || true
    SERVE_CMD="serve"
  fi

  # Kill any existing process on the frontend port.
  FRONTEND_PID=$(lsof -ti:"$FRONTEND_PORT" 2>/dev/null || true)
  if [ -n "$FRONTEND_PID" ]; then
    warn "Port $FRONTEND_PORT in use (PID $FRONTEND_PID). Killing..."
    kill "$FRONTEND_PID" 2>/dev/null || true
    sleep 1
  fi

  # Start serve with SPA fallback and proxy config.
  # serve doesn't proxy, so we use a simple Node.js static server with proxy.
  create_proxy_server
}

create_proxy_server() {
  DIST_DIR="$ROOT/frontend/dist"
  SERVER_FILE="$ROOT/.deployment-server.mjs"

  cat > "$SERVER_FILE" <<'SERVEREOF'
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'frontend', 'dist');
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '4000');
const PORT = parseInt(process.env.FRONTEND_PORT || '80');
const HOST = '0.0.0.0';

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  // Proxy /api/* to the backend.
  if (req.url.startsWith('/api/')) {
    const options = {
      hostname: '127.0.0.1',
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${BACKEND_PORT}` },
    };

    const proxy = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxy.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Backend unavailable' }));
    });

    req.pipe(proxy);
    return;
  }

  // Serve static files from dist/.
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);

  // SPA fallback: if file doesn't exist, serve index.html.
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  SecureShield is running:`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  → API proxy → http://127.0.0.1:${BACKEND_PORT}\n`);
});
SERVEREOF

  # Start the server.
  BACKEND_PORT="$BACKEND_PORT" FRONTEND_PORT="$FRONTEND_PORT" \
    node "$SERVER_FILE" &
  FRONTEND_PID=$!
  sleep 1

  if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    ok "Frontend server running on :$FRONTEND_PORT (PID $FRONTEND_PID)"
  else
    err "Frontend server failed to start"
  fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# § 7. LAUNCH ALL SERVICES
# ═══════════════════════════════════════════════════════════════════════════════

launch_services() {
  info "Launching backend and worker..."

  # Kill any existing processes on the backend port.
  BACKEND_PID_EXISTING=$(lsof -ti:"$BACKEND_PORT" 2>/dev/null || true)
  if [ -n "$BACKEND_PID_EXISTING" ]; then
    warn "Port $BACKEND_PORT in use. Killing..."
    kill "$BACKEND_PID_EXISTING" 2>/dev/null || true
    sleep 1
  fi

  # Start backend.
  (cd backend && NODE_ENV=production node src/app.js) &
  BACKEND_PID=$!

  # Wait for backend to start.
  sleep 2
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    err "Backend failed to start. Check logs."
  fi

  # Start worker.
  (cd backend && NODE_ENV=production node src/workers/index.js) &
  WORKER_PID=$!

  wait_for_port "Backend API" "$BACKEND_PORT" 15
  ok "Backend running on :$BACKEND_PORT"
  ok "Worker running"
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════════
# § 8. CLEANUP & SIGNAL HANDLING
# ═══════════════════════════════════════════════════════════════════════════════

cleanup() {
  echo ""
  info "Shutting down..."

  [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null
  [ -n "${WORKER_PID:-}" ] && kill "$WORKER_PID" 2>/dev/null
  [ -n "${FRONTEND_PID:-}" ] && kill "$FRONTEND_PID" 2>/dev/null

  # Remove temp server file.
  rm -f "$ROOT/.deployment-server.mjs"

  ok "All services stopped."
  echo ""
  echo -e "  To stop infrastructure: ${CYAN}docker stack rm $STACK_NAME${NC}"
  echo ""
  exit 0
}

trap cleanup INT TERM

# ═══════════════════════════════════════════════════════════════════════════════
# § 9. SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

print_summary() {
  LAN_IP=$(ip route get 1 2>/dev/null | awk '{print $7; exit}' 2>/dev/null || \
           ipconfig getifaddr en0 2>/dev/null || \
           hostname -I 2>/dev/null | awk '{print $1}' || echo "")

  echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}${BOLD}  ✅ SecureShield is deployed and running!${NC}"
  echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${BOLD}Frontend${NC}    → http://localhost:${FRONTEND_PORT}"
  [ -n "$LAN_IP" ] && echo -e "  ${BOLD}On LAN${NC}      → http://${LAN_IP}:${FRONTEND_PORT}"
  echo -e "  ${BOLD}API${NC}         → http://localhost:${BACKEND_PORT}/api/health"
  echo -e "  ${BOLD}MongoDB${NC}     → localhost:${MONGO_PORT}"
  echo -e "  ${BOLD}Redis${NC}       → localhost:${REDIS_PORT}"
  echo ""
  echo -e "  ${BOLD}Admin login:${NC}"
  echo -e "    Email    → admin@secureshield.in"
  echo -e "    Password → ChangeMe123!"
  echo ""
  echo -e "  ${BOLD}Commands:${NC}"
  echo -e "    Stop app    → Ctrl+C"
  echo -e "    Stop infra  → docker stack rm ${STACK_NAME}"
  echo -e "    View logs   → tail -f ${DEPLOY_LOG}"
  echo ""
  echo -e "  ${BOLD}Next steps:${NC}"
  echo -e "    1. Log in and go to Settings → API Keys"
  echo -e "    2. Add a free LLM key (Cerebras, Groq, or OpenRouter)"
  echo -e "    3. Upload a policy PDF and run a check"
  echo ""
}

# ═══════════════════════════════════════════════════════════════════════════════
# § 10. MAIN
# ═══════════════════════════════════════════════════════════════════════════════

main() {
  echo ""
  echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  SecureShield — Production Deployment${NC}"
  echo -e "${BOLD}══════════════════════════════════════════════════════════════${NC}"
  echo ""

  check_prereqs
  select_ports
  start_infra
  setup_backend
  build_frontend
  start_frontend_server
  launch_services
  print_summary

  # Keep running until user hits Ctrl+C.
  wait
}

main "$@"
