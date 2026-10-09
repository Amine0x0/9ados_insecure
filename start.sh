#!/bin/bash

echo "starting server..."
(cd ./Core/proxy && PORT=6767 bun run start:dev)