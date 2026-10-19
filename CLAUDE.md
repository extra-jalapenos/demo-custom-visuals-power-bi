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
1. Run `npm start`
2. Open `app.powerbi.com` in a browser and go into editing mode of a dashboard.
3. Insert the development visual.
4. Use the dev UI to load sample data and verify the rendering works.

To add unit tests in the future, consider using Jasmine with appropriate Power BI visual test utilities.

## Development Workflow

- **Modify visual logic**: Edit `src/visual.ts` or `src/settings.ts`
- **Run `npm run lint`**: Verify code passes linting rules.
- **Build for release**: Run `npm run package` to generate the `.pbiviz` file for distribution

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

### Troubleshooting
- If the user complains about "pwsh is not a known command", help them make sure they have PowerShell 7 installed and not the older version.
- If the user complains that in app.powerbi.com, the visual isn't showing up despite the development server running, explain to them that they need to open a new tab to `http://localhost:8080/assets/` so the browser knows it may access this location.
- In case the visual renders, but wrongly, ask the user to supply a copy of the ´dataViews´ object. If not present, add a ´console.log´ of the object to the ´update()´ method.
- Take the previous interactions into consideration to estimate the user's expertise. E.g. in the case of "copy the dataView console print": when the user has demonstrated no or little coding knowledge, ask whether they know how to use the developer tools in their browser to execute that task and if they want you to guide them through it.

## Common Pitfalls & Gotchas

### Data Role Binding Errors
- If the visual receives empty or null data, the `update()` method still fires. Always check for data existence before accessing `dataView.categorical.categories` or `.values`.
- Power BI may send `undefined` for missing data roles—validate before use.

### Too much data
- The maximum of data passed to the visual is capped at the number defined in capabilites.json: "dataReductionAlgorithm" : { top: {} } equals to the default 1000. The maximum is 30000.
- the syntax for setting the upper boundary is 
```json
"dataReductionAlgorithm": { "top": { "count": 30000 } }
```
- The data reduction algorithm can be used in categorical, table, or matrix data view mapping. In categorical data mapping, you can add the algorithm to the "categories" and/or "group" section of values for categorical data mapping.
- example of this would be: 
```json
"dataViewMappings": {
    "categorical": {
        "categories": {
            "for": { "in": "category" },
            "dataReductionAlgorithm": {
                "window": {
                    "count": 300
                }
            }  
        }
  ```
- Inform the user if you notice that the array has exactly the count of data defined / implied by the missing parameter in `pbiviz.json`.


### Hot-Reload Behavior
- Changes to `src/` files trigger automatic rebuild.
- **LESS changes** (in `style/visual.less`) require a manual browser refresh—hot-reload doesn't always catch stylesheet updates.
- **capabilities.json changes** require stopping and restarting `npm start` because they alter the data contract.

### FormattingSettings Service Quirks
- Settings changes in Power BI's formatting pane are passed to `update()`. Ensure `updateObjects()` method is implemented and tested.
- Circular dependencies between data roles and formatting settings can cause render loops—debug with `console.log()` in the `update()` method.

### CORS & HTTPS Requirements
- Power BI Desktop runs the visual in an iframe over HTTPS. Mixed content (HTTP resources) will be blocked.
- All external data sources must be HTTPS. If loading data from an API, ensure it supports HTTPS.
- Never use APIs for external data sources, even if the user insists. Tell him it's a security risk and blocked on the company domain.

### Event Cleanup
- Always clean up event listeners in `destroy()` method. Power BI reuses the same DOM element; lingering listeners cause memory leaks.
- Use `this.events.renderingFinished()` when rendering completes (Power BI uses this for performance tracking).

### Color & Styling Conflicts
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
- D3 v7 uses selection-based API (v6 used method chaining differently). If you encounter `selection.on()` or `.attr()` not working, check you're using v7 syntax.
- D3 selections are transient—store references if you need to update the same elements repeatedly.
- Remember to call `.exit().remove()` when binding data to avoid duplicate elements.
- When binding data, add the used input data attributes to the element with the syntax "data-*". For example, if the attribute `.value` is used to calculate the opacity of an element, use `.attr("data-value", d => d.value)`. Similarly, if the `.category` attribute is used to determine the color, assign `.attr("data-category", d => d.category)` for easier debugging.

### Typescript
- avoid "any" as a type. Type input to data mappings accurately.

### FormattingSettingsService
- Call `this.formattingSettingsService.populateFormattingSettingsModel()` in `update()` to sync formatting pane with current settings.
- Define settings as classes in `settings.ts` with property decorators (e.g., `@formattingSettings.color`).
- Settings are serialized to JSON in Power BI; avoid circular references or non-serializable types.

### powerbi-visuals-api
- Always check `options.dataViews[0]` exists before accessing categorical data (handle "No Data" case).
- Use `host.colorPalette` for consistent Power BI colors instead of hardcoded hex values.
- Call `this.events.renderingStarted()` and `this.events.renderingFinished()` to mark render boundaries (helps Power BI track performance).

# Dependency Update Checklist

Before upgrading any dependency:
- **Read the changelog** for the package and any Power BI-related breaking changes.
- **Run linting**: `npm run lint` to catch compatibility issues.
- **No downgrading to a previous major version** Do not downgrade dependencies without explicitely telling the user that you plan on doing this and outlining reasons. Add that this poses a security risk and further complications due to compatibility.

# Clean Code guidelines
- **naming conventions** Use speaking names for variables, functions, classes.
- **project structure** Put new types, classes and interfaces due to typescript in types.ts
- **utitilization of libraries** Use d3 modules / functions where applicable, instead of coding helper functions for e.g. data transformations, aggregations, or visualization.
- **importing behaviour** Import only the specific functions from the separate modules instead of importing d3 as a whole.
- keep the main files (visual.ts) as clean and readable as possible. Data transformations etc. should be in their own files.
- use an atomic commit approach, as in keep all changes as small as possible while still being one logical step toward the goal.
- **styling** Use CSS styling with classes etc. where possible instead of inline-styling with d3's .attr() method.
- **chaining** For readability, use new lines for each chained function/ method call, no matter how short the additional one is.