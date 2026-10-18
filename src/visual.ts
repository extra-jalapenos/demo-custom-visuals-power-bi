/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
import * as d3 from "d3";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualEventService = powerbi.extensibility.IVisualEventService;

import { VisualFormattingSettingsModel } from "./settings";
import * as dataTransform from "./dataTransform";
import * as calendarLayout from "./calendarLayout";
import * as d3Renderer from "./d3Renderer";
import { RenderConfig } from "./types";

export class Visual implements IVisual {
    private events: IVisualEventService;
    private target: HTMLElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    constructor(options: VisualConstructorOptions) {
        this.events = options.host.eventService;
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
    }

    public update(options: VisualUpdateOptions) {
        this.events.renderingStarted(options);

        try {
            this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualFormattingSettingsModel, options.dataViews[0]);

            if (!options.dataViews || options.dataViews.length === 0) {
                this.showNoDataMessage();
                this.events.renderingFinished(options);
                return;
            }

            const categorical = options.dataViews[0].categorical;

            const dataPoints = dataTransform.extractDataPoints(categorical);

            if (!dataPoints || dataPoints.length === 0) {
                this.showNoDataMessage();
                this.events.renderingFinished(options);
                return;
            }

            const calendar = calendarLayout.buildCalendarGrid(dataPoints);

            const tileColorValue = this.formattingSettings.dataPointCard.tileColor.value.value || "#1f77b4";
            const maxOpacityValue = this.formattingSettings.dataPointCard.maxOpacity.value || 1.0;

            const config: RenderConfig = {
                tileSize: 18,
                padding: { top: 40, right: 40, bottom: 40, left: 80 },
                tileColor: tileColorValue,
                maxOpacity: maxOpacityValue,
            };

            d3Renderer.render(this.target, calendar, dataPoints, config);

            this.events.renderingFinished(options);
        }
        catch (error) {
            console.error('Error in update method', error);
            this.events.renderingFailed(options, String(error));
        }
    }

    private showNoDataMessage(): void {
        d3.select(this.target).selectAll("*").remove();
        const div = d3.select(this.target).append("div").attr("class", "no-data-message");
        div.text("No data available");
    }

    public destroy(): void {
        d3.select(this.target).selectAll("*").remove();
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property.
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}