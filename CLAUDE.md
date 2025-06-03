# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000
npm run build        # Create production build
npm run start        # Start production server
npm run lint         # Run ESLint

# No test commands are configured in this project
```

## High-Level Architecture

This is a **2D CAD web application** built with Next.js for designing modular buildings. The application uses Fabric.js for canvas rendering and Zustand for state management.

### Core Architectural Patterns

1. **Hook-Based Canvas Architecture**: Each tool and feature is implemented as a custom hook in `/src/components/Canvas/hooks/`. These hooks attach event listeners to the Fabric.js canvas and manage their specific functionality:
   - Tool hooks: `useModuleTool`, `useCorridorTool`, `useBalconyTool`, etc.
   - Movement hooks: `useModuleMovement`, `useBathroomPodMovement` (with constraints)
   - Rendering hooks: `useRenderOpenings`, `useRenderBalconies` (sync Zustand → Fabric.js)
   - Feature hooks: `usePanZoom`, `useSnapping`, `useGrid`

2. **State Management**: Zustand stores in `/src/state/` manage different domains:
   - `canvasStore`: Grid settings, zoom, pan, PDF state, scale factor (mm ↔ pixels)
   - `objectStore`: All geometric objects (modules, openings, corridors, balconies, bathroom pods)
   - `toolStore`: Active tool state
   - `selectionStore`: Current selection
   - `templateStore`: Saved templates

3. **Coordinate System**: 
   - Grid units are in millimeters (mm)
   - Grid dimensions are in meters (m)
   - All positions/dimensions are stored as integers in mm
   - `scaleFactor` converts between pixels and mm

4. **Object Hierarchy**:
   - **Modules**: Primary building blocks (walls)
   - **Openings**: Windows/doors attached to module walls
   - **Bathroom Pods**: Constrained within parent modules
   - **Balconies**: Attached to specific module walls
   - **Corridors**: Free-standing rectangular areas

### Key Implementation Details

1. **Grid Constraints**: The `gridConstraints.ts` utility ensures all objects stay within the defined grid boundaries (default 100m × 100m). Movement hooks apply these constraints during drag operations.

2. **Rendering Pipeline**: 
   - User actions → Update Zustand store → Render hooks sync to Fabric.js
   - Each object type has a dedicated render hook that listens to store changes

3. **PDF Import**: Supports importing floor plans as PDF, with calibration tools to set the correct scale.

4. **Snapping System**: Two modes:
   - Grid snapping: Aligns to grid increments
   - Element snapping: Maintains specified gap between elements

### Important Configuration

- **TypeScript**: Strict mode enabled, but build errors are ignored (`tsconfig.json`)
- **Path Alias**: `@/*` maps to `./src/*`
- **Styling**: Emotion CSS-in-JS with styled components
- **Canvas**: Fabric.js with custom webpack config to disable canvas module

### Multi-Floor System

The application supports multiple floors with complete state isolation:

1. **Floor Store** (`/src/state/floorStore.ts`): Manages floor data with per-floor grid state
2. **Floor Sidebar** (`/src/components/Floors/`): Collapsible sidebar for floor management
3. **Floor Sync Hook** (`useFloorSync.ts`): Ensures complete isolation between floors
4. **Floor Modals**: Add/Edit floor modals with PDF upload support
5. **PDF Integration**: Per-floor PDF overlays with conditional PDF Settings menu

**State Isolation**: Each floor maintains completely separate:
- Grid dimensions, zoom level, and pan position
- Object collections (modules, corridors, openings, balconies, bathroom pods)
- PDF overlay and calibration settings
- Element table data

**Floor Switching**: When switching floors, the system:
- Saves current floor state to floor store (grid settings, objects, PDF state)
- Completely clears all objects from both canvas and object stores
- Loads new floor's state with proper isolation
- Updates PDF overlay based on floor's pdfUrl
- Clears fabric.js canvas to prevent visual artifacts

**PDF System**: 
- PDF Settings menu only appears when active floor has PDF
- PDF import stores URL in active floor's pdfUrl property  
- Single PDF loading mechanism (removed duplicate handlers)
- PDF overlay automatically loads when switching to floor with PDF
- Floor-specific PDF calibration and opacity settings

**Critical Fixes Applied**:
- **Duplicate PDF Import Fix**: Removed conflicting PDF handlers
- **Floor Isolation Fix**: Complete state clearing between floor switches
- **Canvas Clearing**: Added useCanvasClear hook to prevent visual artifacts
- **Grid Settings Fix**: Grid dimensions now read from floor-specific state
- **Auto-save Enhancement**: Improved debounced saving with loading state protection

### Development Notes

- The project ignores TypeScript and ESLint errors during build (see `next.config.ts`)
- No test suite is configured
- Main entry point is `/src/app/page.tsx` using Next.js App Router
- Custom fonts (Atkinson Hyperlegible) are loaded from `/public/fonts/`
- Uses UUID for generating unique floor IDs
