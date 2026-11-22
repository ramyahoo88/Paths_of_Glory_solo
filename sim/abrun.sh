#!/bin/sh
# usage: abrun.sh N 'opts' [ref] -> runs ap and cp in parallel
N=$1; O=$2; REF=${3:?reference bot directory}; RO=${4:-'{}'}
node ab.js ap $N 1001 $REF "$O" "$RO" &
node ab.js cp $N 1001 $REF "$O" "$RO" &
wait
