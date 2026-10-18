# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Power BI Custom Visual** project named `tilechartvisual`. Custom visuals are custom visualizations that can be embedded in Power BI reports and dashboards. The visual accepts categorical data and measure values, defined in `capabilities.json`.

## Project Structure

```
tilechartvisual/
├── src/
│   ├── visual.ts          # Main visual class implementing IVisual interface
│   └── settings.ts        # Formatting settings and configuration UI
├── style/
│   └── visual.less        # Styling for the visual
├── assets/
│   └── icon.png          # Visual icon displayed in Power BI
├── capabilities.json      # Defines data roles, properties, and data mappings
├── pbiviz.json           # Visual metadata and configuration
├── package.json          # npm dependencies and scripts
├── tsconfig.json         # TypeScript compiler configuration
└── eslint.config.mjs     # ESLint configuration with Power BI rules
```

## Common Development Commands

All commands should be run from the `tilechartvisual/` directory:

### Development
- `npm start` (or `pbiviz start`) — Starts the development server. Watches for file changes and provides hot-reload capabilities. Accessible at `https://localhost:8080`
- `npm run lint` (or `npx eslint .`) — Runs ESLint to check code quality and Power BI-specific rules

### Packaging & Deployment
- `npm run package` (or `pbiviz package`) — Builds the visual into a `.pbiviz` file for distribution/installation in Power BI

### Prerequisites
- **pbiviz CLI**: `npm i -g powerbi-visuals-tools@latest` (install globally, only once)
- **Certificate**: Run `pbiviz install-cert` in bash to generate the development certificate (required before first `npm start`)
- **Node.js & npm**: Required for local development

## Architecture & Data Flow

### Visual Lifecycle
1. **Constructor** (`Visual.constructor()`): Creates the visual instance, initializes event service and formatting settings
2. **Update** (`Visual.update()`): Called whenever data or settings change; handles rendering and re-renders the visualization
3. **Destroy** (`Visual.destroy()`): Cleanup when visual is removed

### Data Mapping
The visual defines two data roles in `capabilities.json`:
- **Category Data** (`category`): Grouping field — defines the categorical axis (e.g., product names, regions)
- **Measure Data** (`measure`): Numeric values to visualize

The `dataViewMappings` section maps these to a categorical data view, which Power BI provides as a structured data object in the `update()` method.

### Rendering
- The visual renders to an HTML element provided in `options.target` (set in constructor)
- D3.js is the primary visualization library (`@types/d3` and `d3` in dependencies)
- Styling is applied via LESS (`style/visual.less`)

### Settings & Formatting
- `settings.ts` defines the formatting model using `FormattingSettingsService` (from `powerbi-visuals-utils-formattingmodel`)
- These settings appear in Power BI's formatting pane when the visual is selected
- `capabilities.json` defines which properties are available (e.g., `defaultColor`, `fontSize`)

## Key Files & Their Roles

- **visual.ts**: Core visual class; implements `IVisual` interface with `constructor()`, `update()`, and `destroy()` methods
- **settings.ts**: Formatting model definition; declares UI properties and their types
- **capabilities.json**: Contract between the visual and Power BI — defines what data roles it accepts, what formatting options exist, and how data should be mapped
- **pbiviz.json**: Metadata (name, GUID, version, icons, assets)
- **eslint.config.mjs**: Uses `eslint-plugin-powerbi-visuals` for Power BI-specific linting rules

## TypeScript & Build
- **Target**: ES2022
- **Build output**: `./.tmp/build/` (temporary, cleared on rebuild)
- **Source maps**: Enabled for debugging
- ESLint checks both TS and JS files; configuration ignores `node_modules/**`, `dist/**`, `.vscode/**`, and `.tmp/**`

## Testing & Validation
Currently, there are no automated tests in the project. Manual testing is done via:
1. Run `npm start` in the `tilechartvisual/` directory
2. Open `https://localhost:8080` in a browser to preview the visual
3. Use the dev UI to load sample data and verify the rendering works
4. Test with real Power BI Desktop by importing the `.pbiviz` file

To add unit tests in the future, consider using Jest or Jasmine with appropriate Power BI visual test utilities.

## Development Workflow

1. **Modify visual logic**: Edit `src/visual.ts` or `src/settings.ts`
2. **Run `npm start`**: Development server automatically rebuilds on file changes
3. **Check browser**: The visual updates in real-time (or refresh if needed)
4. **Run `npm run lint`**: Verify code passes linting rules before committing
5. **Build for release**: Run `npm run package` to generate the `.pbiviz` file for distribution

## External Dependencies

### Production Dependencies
- **powerbi-visuals-api** (5.11.1): Power BI visual API definitions (types and interfaces). **Tightly coupled to Power BI API version 5.11.1**—major version changes may break compatibility.
- **powerbi-visuals-utils-formattingmodel** (6.0.4): Utilities for defining formatting UI and property panes.
- **d3** (7.9.0): Data-driven visualization library. Version 7 is stable; v8+ has breaking changes in selection/transition APIs.

### Development Dependencies
- **TypeScript** (5.5.4): Targets ES2022. Do not upgrade without testing against `powerbi-visuals-api` compatibility.
- **ESLint** (9.11.1) + **@typescript-eslint/eslint-plugin** (8.8.0): Code quality. The Power BI plugin enforces visual-specific rules (e.g., no hardcoded colors, proper event cleanup).
- **@types/d3** (7.4.3): Type definitions for D3; must match the D3 major version (v7).

### Version Lock Strategy
- **Do not blindly upgrade dependencies.** Power BI visuals have strict API contracts.
- Before upgrading `powerbi-visuals-api`, check Power BI release notes for supported versions.
- Test locally with `npm start` after any dependency change.
- Run `npm run lint` to catch compatibility issues early.

## Environment Setup

### Required Node & npm Versions
- **Node.js**: 18.x or higher recommended (not explicitly enforced; check pbiviz compatibility if issues arise)
- **npm**: 8.x or higher
- No `.nvmrc` file present; consider adding one to pin the Node version for consistency

To check your versions:
```bash
node --version
npm --version
```

### VS Code Configuration
The project includes VS Code settings in `.vscode/`:
- **settings.json**: Workspace-specific editor settings (formatting, file associations, etc.)
- **launch.json**: Debug configuration for running the visual in debug mode
- **mcp.json**: MCP (Model Context Protocol) server configuration for AI integration

These settings are automatically applied when you open the folder in VS Code. Do not commit changes to these that are machine-specific.

## Development Certificate

### Initial Setup
The development certificate is required to serve the visual over HTTPS locally (Power BI requires secure contexts).

**First-time setup:**
```bash
pbiviz install-cert
```

This creates a self-signed certificate in your system's certificate store. You may be prompted to allow the installation.

### Certificate Management
- **Expiration**: Certificates typically last 1 year. If `npm start` fails with SSL errors, regenerate:
  ```bash
  pbiviz install-cert
  ```
- **Windows 11 specifics**: The certificate is installed in the Windows Certificate Store. Use `certmgr.msc` to inspect certificates if needed.
- **Browsers**: Browsers will warn about self-signed certs; accept the warning to proceed to `https://localhost:8080`.

### Troubleshooting
- If you see "ERR_CERT_AUTHORITY_INVALID" when starting the dev server, regenerate the certificate.
- Clear browser cache if certificate issues persist.

## Common Pitfalls & Gotchas

### 1. Data Role Binding Errors
- If the visual receives empty or null data, the `update()` method still fires. Always check for data existence before accessing `dataView.categorical.categories` or `.values`.
- Power BI may send `undefined` for missing data roles—validate before use.

### 2. Hot-Reload Behavior
- Changes to `src/` files trigger automatic rebuild.
- **LESS changes** (in `style/visual.less`) require a manual browser refresh—hot-reload doesn't always catch stylesheet updates.
- **capabilities.json changes** require stopping and restarting `npm start` because they alter the data contract.

### 3. FormattingSettings Service Quirks
- Settings changes in Power BI's formatting pane are passed to `update()`. Ensure `updateObjects()` method is implemented and tested.
- Circular dependencies between data roles and formatting settings can cause render loops—debug with `console.log()` in the `update()` method.

### 4. D3 Version-Specific Issues
- D3 v7 uses selection-based API (v6 used method chaining differently). If you encounter `selection.on()` or `.attr()` not working, check you're using v7 syntax.
- D3 selections are transient—store references if you need to update the same elements repeatedly.
- Remember to call `.exit().remove()` when binding data to avoid duplicate elements.

### 5. CORS & HTTPS Requirements
- Power BI Desktop runs the visual in an iframe over HTTPS. Mixed content (HTTP resources) will be blocked.
- All external data sources must be HTTPS. If loading data from an API, ensure it supports HTTPS.

### 6. Event Cleanup
- Always clean up event listeners in `destroy()` method. Power BI reuses the same DOM element; lingering listeners cause memory leaks.
- Use `this.events.renderingFinished()` when rendering completes (Power BI uses this for performance tracking).

### 7. Color & Styling Conflicts
- The Power BI formatting pane colors may not preview correctly in development; test in Power BI Desktop for final appearance.
- LESS compilation happens at build time; changes require `npm start` restart if not hot-reloading.

## Library-Specific Guidance

### D3.js Usage
- **Data Binding**: Use D3's `.data()`/`.enter()`/`.exit()` pattern for scalability. Avoid manual DOM manipulation if data size changes.
- **Scales**: Use `d3.scaleLinear()` for continuous data, `d3.scaleBand()` for categories. Always set domain and range.
- **Transitions**: D3 v7 transitions work via `.transition().duration(ms)`. Use for smooth animations.
- **Example pattern**:
  ```typescript
  const selection = d3.select(this.target)
    .selectAll(".tile")
    .data(dataPoints, d => d.key);
  
  selection.exit().remove();
  selection.enter().append("rect").attr("class", "tile")
    .merge(selection)
    .attr("x", d => xScale(d.category));
  ```

### FormattingSettingsService
- Call `this.formattingSettingsService.populateFormattingSettingsModel()` in `update()` to sync formatting pane with current settings.
- Define settings as classes in `settings.ts` with property decorators (e.g., `@formattingSettings.color`).
- Settings are serialized to JSON in Power BI; avoid circular references or non-serializable types.

### powerbi-visuals-api
- Always check `options.dataViews[0]` exists before accessing categorical data (handle "No Data" case).
- Use `host.colorPalette` for consistent Power BI colors instead of hardcoded hex values.
- Call `this.events.renderingStarted()` and `this.events.renderingFinished()` to mark render boundaries (helps Power BI track performance).

## Dependency Update Checklist

Before upgrading any dependency:
1. **Read the changelog** for the package and any Power BI-related breaking changes.
2. **Test locally**: Run `npm install`, then `npm start` and verify the visual renders.
3. **Run linting**: `npm run lint` to catch compatibility issues.
4. **Test with sample data**: Use the dev UI to load data and check rendering.
5. **Commit separately**: Dependency updates should be a separate commit from feature changes.

## Debugging Tips

- **Browser DevTools**: Open in `https://localhost:8080` to debug TypeScript (source maps enabled).
- **Power BI Desktop**: Install the generated `.pbiviz` file to test in production context.
- **Console Logging**: Add `console.log()` in `update()` to trace data flow. Remove before committing.
- **pbiviz CLI Help**: Run `pbiviz --help` for additional commands (e.g., `pbiviz validate-cert`).