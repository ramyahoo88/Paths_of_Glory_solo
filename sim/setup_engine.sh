#!/bin/sh
# Fetches the Rally the Troops Paths of Glory module (rules engine) at a pinned commit and
# appends a small read-only hook so the bot can query board state. The engine is not
# redistributed here; it is Copyright Nathan Forget and Tor Andersson, implemented with GMT's permission.
set -e
cd "$(dirname "$0")"
REV=c58b0b4
[ -d rtt-pog ] || git clone https://github.com/rally-the-troops/paths-of-glory rtt-pog
(cd rtt-pog && git checkout -q $REV)
mkdir -p ../engine
cp rtt-pog/data.js rtt-pog/lz4.js ../engine/
cp rtt-pog/rules.js ../engine/rules.js
cat engine_hook.js >> ../engine/rules.js
echo "Engine ready in ../engine"
