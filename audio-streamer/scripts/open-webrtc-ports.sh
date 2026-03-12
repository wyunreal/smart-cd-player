#!/bin/bash
set -e

MIN_PORT=20000
MAX_PORT=20100

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <REMOTE_USER> <REMOTE_HOST>"
    echo "Example: $0 pi 192.168.68.50"
    exit 1
fi

REMOTE_USER=$1
REMOTE_HOST=$2

echo "🔓 Opening UDP ${MIN_PORT}-${MAX_PORT} on ${REMOTE_USER}@${REMOTE_HOST}..."

REMOTE_CMD="
set -e
if command -v ufw >/dev/null 2>&1 && sudo ufw status | grep -q 'Status: active'; then
    echo '  → Detected: ufw'
    sudo ufw allow ${MIN_PORT}:${MAX_PORT}/udp
    sudo ufw reload

elif command -v firewall-cmd >/dev/null 2>&1 && sudo firewall-cmd --state 2>/dev/null | grep -q running; then
    echo '  → Detected: firewalld'
    sudo firewall-cmd --permanent --add-port=${MIN_PORT}-${MAX_PORT}/udp
    sudo firewall-cmd --reload

elif command -v nft >/dev/null 2>&1; then
    echo '  → Detected: nftables'
    # Create a dedicated table+chain for WebRTC ports (safe to run multiple times)
    sudo nft add table inet webrtc-allow 2>/dev/null || true
    sudo nft add chain inet webrtc-allow input '{ type filter hook input priority 0 ; policy accept ; }' 2>/dev/null || true
    # Remove existing rule if present, then add fresh
    sudo nft flush chain inet webrtc-allow input 2>/dev/null || true
    sudo nft add rule inet webrtc-allow input udp dport ${MIN_PORT}-${MAX_PORT} accept
    echo '  → Rule added to inet table webrtc-allow'

elif command -v iptables >/dev/null 2>&1; then
    echo '  → Using iptables'
    sudo iptables -C INPUT -p udp --dport ${MIN_PORT}:${MAX_PORT} -j ACCEPT 2>/dev/null \
        && echo '  → Rule already exists, nothing to do.' \
        || sudo iptables -I INPUT -p udp --dport ${MIN_PORT}:${MAX_PORT} -j ACCEPT
    command -v netfilter-persistent >/dev/null 2>&1 && sudo netfilter-persistent save || true

else
    echo '  ⚠️  No firewall tool found — ports should already be open.'
fi
echo '  ✅ Done.'
"

ssh -t "${REMOTE_USER}@${REMOTE_HOST}" "${REMOTE_CMD}"

echo "✅ UDP ${MIN_PORT}-${MAX_PORT} open on ${REMOTE_HOST}"
