# nx-bun

An Nx plugin for integrating Bun into modern Nx workspaces.

## Purpose

`nx-bun` aims to provide a maintained, modern alternative to older Bun + Nx integrations that depended on deprecated Nx extension points such as custom task runners.

The goal of this project is to make Bun feel like a first-class citizen in Nx by offering:

* generators for Bun-based applications and libraries
* executors for common Bun workflows such as build, dev, test, and run
* minimal reliance on Nx internals that are likely to change across releases
* compatibility with current and future Nx versions

## Status

Early implementation phase.

The repo is wired as an Nx workspace and now includes a working `run` executor smoke test.

It also includes an API-first `build` executor with CLI fallback for Bun bundles.
