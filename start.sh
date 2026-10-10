#!/bin/bash

echo "starting server..."
(cd ./Core/proxy && bun install &&  PORT=6767 bun run start:dev)
