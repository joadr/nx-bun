# `build` Executor Specification

## Purpose

The `build` executor produces Bun bundles for Nx projects.

It is API-first when `Bun.build()` is available and falls back to the Bun CLI when `useCli` is enabled or Bun APIs are unavailable.

## Options

* `entrypoints`: Bun entry files to build
* `outputPath`: output directory for artifacts
* `external`: packages or paths to exclude
* `format`: bundle format
* `minify`: enable minification
* `sourcemap`: source map mode
* `splitting`: enable code splitting
* `target`: compilation target
* `define`: compile-time replacements
* `naming`: output naming pattern
* `publicPath`: runtime asset prefix
* `useCli`: force CLI mode

## Expected behavior

* resolve paths from the project root
* build artifacts into the declared output directory
* preserve a simple option surface
* return `success: false` on build failure
