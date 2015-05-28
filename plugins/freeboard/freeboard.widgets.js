// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               | \\
// │ Copyright © 2015 Percila Njira  (https://github.com/percila)       │ \\
// │ Copyright © 2015 Modio AB. (https://modio.se)                      │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function () {
    var SPARKLINE_HISTORY_LENGTH = 100;

    function easeTransitionText(newValue, textElement, duration) {

		var currentValue = $(textElement).text();

        if (currentValue == newValue)
            return;

        if ($.isNumeric(newValue) && $.isNumeric(currentValue)) {
            var numParts = newValue.toString().split('.');
            var endingPrecision = 0;

            if (numParts.length > 1) {
                endingPrecision = numParts[1].length;
            }

            numParts = currentValue.toString().split('.');
            var startingPrecision = 0;

            if (numParts.length > 1) {
                startingPrecision = numParts[1].length;
            }

            jQuery({transitionValue: Number(currentValue), precisionValue: startingPrecision}).animate({transitionValue: Number(newValue), precisionValue: endingPrecision}, {
                duration: duration,
                step: function () {
                    $(textElement).text(this.transitionValue.toFixed(this.precisionValue));
                },
                done: function () {
                    $(textElement).text(newValue);
                }
            });
        }
        else {
            $(textElement).text(newValue);
        }
    }

    function addValueToSparkline(element, value) {
        var values = $(element).data().values;

        if (!values) {
            values = [];
        }

        if (values.length >= SPARKLINE_HISTORY_LENGTH) {
            values.shift();
        }

        values.push(Number(value));

        $(element).data().values = values;

        $(element).sparkline(values, {
            type: "line",
            height: "100%",
            width: "100%",
            fillColor: false,
            lineColor: "#FF9900",
            lineWidth: 2,
            spotRadius: 3,
            spotColor: false,
            minSpotColor: "#78AB49",
            maxSpotColor: "#78AB49",
            highlightSpotColor: "#9D3926",
            highlightLineColor: "#9D3926"
        });
    }

	var valueStyle = freeboard.getStyleString("values");

	freeboard.addStyle('.widget-big-text', valueStyle + "font-size:75px;");

	freeboard.addStyle('.tw-display', 'width: 100%; height:100%; display:table; table-layout:fixed;');

	freeboard.addStyle('.tw-tr',
		'display:table-row;');

	freeboard.addStyle('.tw-tg',
		'display:table-row-group;');

	freeboard.addStyle('.tw-tc',
		'display:table-caption;');

	freeboard.addStyle('.tw-td',
		'display:table-cell;');

	freeboard.addStyle('.tw-value',
        'font-family: "HelveticaNeue-UltraLight", "Helvetica Neue Ultra Light", "Helvetica Neue", sans-serif;' +
        'color: #58595b' +
        'font-weight: 100;' +
        'color: a6ce00;' +
		'overflow: hidden;' +
		'display: inline-block;' +
		'text-overflow: ellipsis;');

	freeboard.addStyle('.tw-unit',
		'display: inline-block;' +
		'padding-left: 10px;' +
		'padding-bottom: 1.1em;' +
		'vertical-align: bottom;');

	freeboard.addStyle('.tw-value-wrapper',
		'position: relative;' +
		'vertical-align: middle;' +
		'height:100%;');

	freeboard.addStyle('.tw-sparkline',
		'height:20px;');

    var textWidget = function (settings) {

        var self = this;

        var currentSettings = settings;
		var displayElement = $('<div class="tw-display"></div>');
		var titleElement = $('<h2 class="section-title tw-title tw-td"></h2>');
        var valueElement = $('<div class="tw-value"></div>');
        var unitsElement = $('<div class="tw-unit"></div>');
        var sparklineElement = $('<div class="tw-sparkline tw-td"></div>');

		function updateValueSizing()
		{
			if(!_.isUndefined(currentSettings.units) && currentSettings.units != "") // If we're displaying our units
			{
				valueElement.css("max-width", (displayElement.innerWidth() - unitsElement.outerWidth(true)) + "px");
			}
			else
			{
				valueElement.css("max-width", "100%");
			}
		}

        this.render = function (element) {
			$(element).empty();

			$(displayElement)
				.append($('<div class="tw-tr"></div>').append(titleElement))
				.append($('<div class="tw-tr"></div>').append($('<div class="tw-value-wrapper tw-td"></div>').append(valueElement).append(unitsElement)))
				.append($('<div class="tw-tr"></div>').append(sparklineElement));

			$(element).append(displayElement);

			updateValueSizing();
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;

			var shouldDisplayTitle = (!_.isUndefined(newSettings.title) && newSettings.title != "");
			var shouldDisplayUnits = (!_.isUndefined(newSettings.units) && newSettings.units != "");

			if(newSettings.sparkline)
			{
				sparklineElement.attr("style", null);
			}
			else
			{
				delete sparklineElement.data().values;
				sparklineElement.empty();
				sparklineElement.hide();
			}

			if(shouldDisplayTitle)
			{
				titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
				titleElement.attr("style", null);
			}
			else
			{
				titleElement.empty();
				titleElement.hide();
			}

			if(shouldDisplayUnits)
			{
				unitsElement.html((_.isUndefined(newSettings.units) ? "" : newSettings.units));
				unitsElement.attr("style", null);
			}
			else
			{
				unitsElement.empty();
				unitsElement.hide();
			}

			var valueFontSize = 30;

			if(newSettings.size == "big")
			{
				valueFontSize = 75;

				if(newSettings.sparkline)
				{
					valueFontSize = 60;
				}
			}

			valueElement.css({"font-size" : valueFontSize + "px"});

			updateValueSizing();
        }

		this.onSizeChanged = function()
		{
			updateValueSizing();
		}

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "value") {

                if (currentSettings.animate) {
                    easeTransitionText(newValue, valueElement, 500);
                }
                else {
                    valueElement.text(newValue);
                }

                if (currentSettings.sparkline) {
                    addValueToSparkline(sparklineElement, newValue);
                }
            }
        }

        this.onDispose = function () {

        }

        this.getHeight = function () {
            if (currentSettings.size == "big" || currentSettings.sparkline) {
                return 2;
            }
            else {
                return 1;
            }
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "text_widget",
        display_name: "Text",
        "external_scripts" : [
            "freeboard/plugins/thirdparty/jquery.sparkline.min.js"
        ],
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
            {
                name: "size",
                display_name: "Size",
                type: "option",
                options: [
                    {
                        name: "Regular",
                        value: "regular"
                    },
                    {
                        name: "Big",
                        value: "big"
                    }
                ]
            },
            {
                name: "value",
                display_name: "Value",
                type: "calculated"
            },
            {
                name: "sparkline",
                display_name: "Include Sparkline",
                type: "boolean"
            },
            {
                name: "animate",
                display_name: "Animate Value Changes",
                type: "boolean",
                default_value: true
            },
            {
                name: "units",
                display_name: "Units",
                type: "text"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new textWidget(settings));
        }
    });

    var gaugeID = 0;
	freeboard.addStyle('.gauge-widget-wrapper', "width: 100%;text-align: center;");
	freeboard.addStyle('.gauge-widget', "width:200px;height:160px;display:inline-block;");

    var gaugeWidget = function (settings) {
        var self = this;

        var thisGaugeID = "gauge-" + gaugeID++;
        var titleElement = $('<h2 class="section-title"></h2>');
        var gaugeElement = $('<div class="gauge-widget" id="' + thisGaugeID + '"></div>');

        var gaugeObject;
        var rendered = false;

        var currentSettings = settings;

        function createGauge() {
            if (!rendered) {
                return;
            }

            gaugeElement.empty();

            gaugeObject = new JustGage({
                id: thisGaugeID,
                value: (_.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value),
                min: (_.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value),
                max: (_.isUndefined(currentSettings.max_value) ? 0 : currentSettings.max_value),
                label: currentSettings.units,
                showInnerShadow: false,
                valueFontColor: "#005CE3"
            });
        }

        this.render = function (element) {
            rendered = true;
            $(element).append(titleElement).append($('<div class="gauge-widget-wrapper"></div>').append(gaugeElement));
            createGauge();
        }

        this.onSettingsChanged = function (newSettings) {
            if (newSettings.min_value != currentSettings.min_value || newSettings.max_value != currentSettings.max_value || newSettings.units != currentSettings.units) {
                currentSettings = newSettings;
                createGauge();
            }
            else {
                currentSettings = newSettings;
            }

            titleElement.html(newSettings.title);
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (!_.isUndefined(gaugeObject)) {
                gaugeObject.refresh(Number(newValue));
            }
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return 3;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "gauge",
        display_name: "Gauge",
        "external_scripts" : [
            "freeboard/plugins/thirdparty/raphael.2.1.0.min.js",
            "freeboard/plugins/thirdparty/justgage.1.0.1.js"
        ],
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
            {
                name: "value",
                display_name: "Value",
                type: "calculated"
            },
            {
                name: "units",
                display_name: "Units",
                type: "text"
            },
            {
                name: "min_value",
                display_name: "Minimum",
                type: "text",
                default_value: 0
            },
            {
                name: "max_value",
                display_name: "Maximum",
                type: "text",
                default_value: 100
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new gaugeWidget(settings));
        }
    });


	freeboard.addStyle('.sparkline', "width:100%;height: 75px;");
    var sparklineWidget = function (settings) {
        var self = this;

        var titleElement = $('<h2 class="section-title"></h2>');
        var sparklineElement = $('<div class="sparkline"></div>');

        this.render = function (element) {
            $(element).append(titleElement).append(sparklineElement);
        }

        this.onSettingsChanged = function (newSettings) {
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            addValueToSparkline(sparklineElement, newValue);
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return 2;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "sparkline",
        display_name: "Sparkline",
        "external_scripts" : [
            "freeboard/plugins/thirdparty/jquery.sparkline.min.js"
        ],
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
            {
                name: "value",
                display_name: "Value",
                type: "calculated"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new sparklineWidget(settings));
        }
    });

    var pictureWidget = function(settings)
    {
        var self = this;
        var widgetElement;
        var timer;
        var imageURL;

        function stopTimer()
        {
            if(timer)
            {
                clearInterval(timer);
                timer = null;
            }
        }

        function updateImage()
        {
            if(widgetElement && imageURL)
            {
                var cacheBreakerURL = imageURL + (imageURL.indexOf("?") == -1 ? "?" : "&") + Date.now();

                $(widgetElement).css({
                    "background-image" :  "url(" + cacheBreakerURL + ")"
                });
            }
        }

        this.render = function(element)
        {
            $(element).css({
                width : "100%",
                height: "100%",
                "background-size" : "cover",
                "background-position" : "center"
            });

            widgetElement = element;
        }

        this.onSettingsChanged = function(newSettings)
        {
            stopTimer();

            if(newSettings.refresh && newSettings.refresh > 0)
            {
                timer = setInterval(updateImage, Number(newSettings.refresh) * 1000);
            }
        }

        this.onCalculatedValueChanged = function(settingName, newValue)
        {
            if(settingName == "src")
            {
                imageURL = newValue;
            }

            updateImage();
        }

        this.onDispose = function()
        {
            stopTimer();
        }

        this.getHeight = function()
        {
            return 4;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "picture",
        display_name: "Picture",
        fill_size: true,
        settings: [
            {
                name: "src",
                display_name: "Image URL",
                type: "calculated"
            },
            {
                "type": "number",
                "display_name": "Refresh every",
                "name": "refresh",
                "suffix": "seconds",
                "description":"Leave blank if the image doesn't need to be refreshed"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new pictureWidget(settings));
        }
    });

    freeboard.addStyle('.bargraph-widget-wrapper', "width: 100%;text-align: center;");
    freeboard.addStyle('.bargraph-widget', "width:100%;height:200px;display:inline-block;");
    freeboard.addStyle('.axis path, .axis line', "fill:none;stroke:#58595b;shape-rendering:crispEdges;");
    freeboard.addStyle('.axis text', "font-family:sans-serif;font-size:11px;fill:#58595b;");
    freeboard.addStyle('.x_label, .y_label', "font-family:sans-serif;font-size:15px;font-weight:bold;fill:#58595b;");
    freeboard.addStyle('.legend text',"fill:#58595b;");

    var bargraphWidget = function(settings){

        var self = this;

        var titleElement = $('<h2 class="section-title"></h2>');
        var bargraphElement = $('<div class="bargraph-widget"></div>');

        this.render = function (element) {
            $(element).append(titleElement).append($('<div class="bargraph-widget-wrapper"></div>').append(bargraphElement));
        }

        var currentSettings = settings;

        // data format {"2015":{"1":{"delta":11180.2},"2":{"delta":9960.5},"3":{"delta":9052.2}}}
        function createBarGraph(allValues) {
            bargraphElement.empty();

            var legendLabels = [];
            var graphValues = [];
            var legendVarsCounter = 0;

            for (var key in allValues) {
                if (allValues.hasOwnProperty(key)) {
                    legendLabels.push(currentSettings.legend[legendVarsCounter].value);
                    graphValues.push(allValues[key]);
                    legendVarsCounter++;
                }
            }

            var firstKey = Object.keys(allValues)[0];

            var barPadding = 5;
            var margin = {left: 55, right: 20, top: 20, bottom: 30};
            var longestGraphLength = _.keys(allValues[firstKey]).length;

            var calculatedGraphLength = longestGraphLength * _.keys(allValues).length;
            var barWidth = (bargraphElement[0].clientWidth * 0.65 - longestGraphLength * barPadding - margin.left - margin.right) / calculatedGraphLength;

            var svgWidth = (barWidth + barPadding) * longestGraphLength * graphValues.length;
            var svgHeight = bargraphElement[0].clientHeight;
            var xPosMultiple = svgWidth / longestGraphLength;
            var barSvg = d3.select(bargraphElement[0])
                .append("svg")
                .attr("width", (svgWidth + margin.left + margin.right) * 1.5)
                .attr("height", svgHeight + margin.top + margin.bottom);

            // identifying the tallest graph
            var longestGraph = [];
            for (var key in graphValues[0]) {
                if (graphValues[0].hasOwnProperty(key)) {
                    longestGraph.push(graphValues[0][key]);
                }
            }

            var axesLabels = [];
            for (var key in longestGraph) {
                if (longestGraph.hasOwnProperty(key)) {
                    axesLabels.push(key);
                }
            }

            var barYValues = [];
            // The Y-axis values
            graphValues.forEach(function(valueGraphSet) {
                var barYValue = [];
                for (var key in valueGraphSet) {
                    for (var key_1 in valueGraphSet[key]) {
                        if (valueGraphSet[key].hasOwnProperty(key_1)) {
                            barYValue.push(valueGraphSet[key][key_1]);
                        }
                    }
                }
                barYValues.push(barYValue);
            });

            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            var barColors = ["#a6ce00", "#009245", "#63B61C", "#31A430", "#88C30D", "#6BBBFD", "#3087EF", "#73C2FF"];
            var yValuesScale = d3.scale.linear()
                .domain([0, d3.max(_.flatten(barYValues))])
                .range([0, svgHeight]);

            barYValues.forEach(function (yValues, index) {

                barSvg.append("g")
                    .attr("transform", "translate(" + (margin.left + (barWidth * index)) + ",5)")
                    .selectAll("rect")
                    .data(yValues)
                    .enter()
                    .append("rect")
                    .attr("x", function (d, i) {
                        return i * (xPosMultiple);
                    })
                    .attr("y", function (d) {
                        return svgHeight - (yValuesScale(d));
                    })
                    .attr("width", barWidth)
                    .attr("height", function (d) {
                        return yValuesScale(d);
                    })
                    .attr("fill", function (d) {
                        return barColors[index % barColors.length];
                    });
            });

            var x_domain = [];
            for (var key in longestGraph) {
                if (longestGraph.hasOwnProperty(key)) {
                    x_domain.push(months[key]);
                }
            }

            var xAxisScale = d3.scale.ordinal()
                .domain(x_domain)
                .rangeBands([0, svgWidth]);
            var xAxis = d3.svg.axis()
                .scale(xAxisScale)
                .orient("bottom");

            barSvg.append("g")
                .attr("transform", "translate(" + (margin.left) + "," + (svgHeight + 5 ) + ")")
                .attr("class", "axis")
                .call(xAxis);

            barSvg.append("g")
                .attr("transform", "translate(" + (svgWidth * 0.5) + ", " + (svgHeight + margin.bottom + 5) + ")")
                .append("text")
                .attr("class", "x_label")
                .attr("text-anchor", "center")
                .text(currentSettings.x_label);

            var yAxisScale = d3.scale.linear()
                .domain([0, d3.max(_.flatten(barYValues))])
                .range([svgHeight, 0]);
            var yAxis = d3.svg.axis()
                .scale(yAxisScale)
                .orient("left")
                .ticks("6");

            barSvg.append("g")
                .attr("transform", "translate(" + margin.left + ",5)")
                .attr("class", "axis")
                .call(yAxis);

            barSvg.append("g")
                .attr("transform", "translate(0, " + (svgHeight * 0.6) + ")")
                .append("text")
                .attr("class", "y_label")
                .attr("text-anchor", "center")
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90)")
                .text(currentSettings.y_label);

            var legend = barSvg.append("g")
                .attr("transform", "translate(" + (1.4 * svgWidth) + " ,0)")
                .attr("class", "legend");

            legend.selectAll("circle")
                .data(legendLabels)
                .enter()
                .append("circle")
                .attr("cx", 2)
                .attr("cy", function (d, i) {
                    return (i + 1) * (0.15 * svgHeight);
                })
                .attr("r", (0.0225 * svgWidth))
                .style("fill", function (d, i) {
                    return barColors[i];
                });

            legend.selectAll("text")
                .data(legendLabels)
                .enter()
                .append("text")
                .attr("x", 10 + 0.02 * svgWidth)
                .attr("y", function (d, i) {
                    return (i + 1) * (0.15 * svgHeight);
                })
                .attr("dy", ".35em")
                .text(function (d) {
                    return d;
                });
        }

        this.onSettingsChanged = function (newSettings) {
            titleElement.html(newSettings.title);
            currentSettings = newSettings;
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            createBarGraph(newValue);
        }

        this.onDispose = function () {

        }

        this.getHeight = function () {
            return 5;
        }

        this.onSettingsChanged(settings);
    };


    freeboard.loadWidgetPlugin({
        type_name: "bargraph",
        display_name: "Bar Graph",
        "external_scripts" : [
            "js/d3.min.js"
        ],
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
            {
                name: "value",
                display_name: "Value",
                type: "calculated"
            },
            {
                name: "x_label",
                display_name: "X-Label",
                type: "text"
            },
            {
                name: "y_label",
                display_name: "Y-Label",
                type: "text"
            },
            {
                "name": "legend",
                "display_name": "Legend(s)",
                "type": "array",
                "settings": [
                    {
                        "name": "name",
                        "display_name": "Name",
                        "type": "text"
                    },
                    {
                        "name": "value",
                        "display_name": "Value",
                        "type": "text"
                    }
                ],
                "description": "ADD custom legend name for each coloured bar."
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new bargraphWidget(settings));
        }
    });
}());
