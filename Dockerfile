# FinTrackPro — Expo dev server in a container.
#
# What this image is for:
#   - Running the Metro bundler
#   - Serving the app in a browser (Expo web)
#   - Serving Expo Go on a physical phone via a tunnel
#
# What it CANNOT do: run the iOS/Android simulators — those require the host OS
# and are not available inside a Linux container.

# Expo SDK 54 requires Node >= 20.19; Node 22 LTS is the safe choice.
FROM node:22-bookworm-slim

# git is handy for some transitive installs; the rest keeps the image slim.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV EXPO_NO_TELEMETRY=1 \
    # Reliable file watching over Windows/Docker Desktop bind mounts.
    CHOKIDAR_USEPOLLING=true \
    WATCHPACK_POLLING=true \
    # Bind Metro to all interfaces so host port-forwarding reaches it.
    EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Install dependencies first so this layer is cached across code changes.
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# App source (node_modules is masked by an anonymous volume in compose).
COPY . .

# Metro (8081), Expo (19000-19002), classic web dev server (19006).
EXPOSE 8081 19000 19001 19002 19006

# Default: browser preview. Override in docker-compose for tunnel/LAN modes.
CMD ["npx", "expo", "start", "--web"]
