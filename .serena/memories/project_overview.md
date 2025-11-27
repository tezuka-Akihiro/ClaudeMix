# Project Overview

## Purpose
ClaudeMix application for MVP development. This is a web application built with Remix framework.

## Tech Stack
- **Framework**: Remix (React-based full-stack framework)
- **Runtime**: Node.js
- **Build Tool**: Vite
- **Language**: JavaScript/TypeScript (mixed)
- **UI**: React 18

## Key Dependencies
- @remix-run/node, @remix-run/react, @remix-run/serve
- React 18
- Vite 6

## Project Structure
- `/app` - Remix application code (routes, components)
  - `/routes` - Route definitions and specs
- `/public` - Static assets  
- `/build` - Build output
- `/node_modules` - Dependencies
- `/scripts` - Build/development scripts

## Spec Files
The project uses YAML specification files for test data and API definitions:
- `app/routes/login-spec.yaml` - Login feature specifications
- `app/routes/profile-spec.yaml` - Profile feature specifications

These spec files contain comprehensive test data, validation rules, API mocks, and UI element selectors.