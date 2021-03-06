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

	freeboard.addStyle('div.pointer-value', "position:absolute;height:95px;margin: auto;top: 0px;bottom: 0px;width: 100%;text-align:center;");
    var pointerWidget = function (settings) {
        var self = this;
        var paper;
        var strokeWidth = 3;
        var triangle;
        var width, height;
        var currentValue = 0;
        var valueDiv = $('<div class="widget-big-text"></div>');
        var unitsDiv = $('<div></div>');

        function polygonPath(points) {
            if (!points || points.length < 2)
                return [];
            var path = []; //will use path object type
            path.push(['m', points[0], points[1]]);
            for (var i = 2; i < points.length; i += 2) {
                path.push(['l', points[i], points[i + 1]]);
            }
            path.push(['z']);
            return path;
        }

        this.render = function (element) {
            width = $(element).width();
            height = $(element).height();

            var radius = Math.min(width, height) / 2 - strokeWidth * 2;

            paper = Raphael($(element).get()[0], width, height);
            var circle = paper.circle(width / 2, height / 2, radius);
            circle.attr("stroke", "#FF9900");
            circle.attr("stroke-width", strokeWidth);

            triangle = paper.path(polygonPath([width / 2, (height / 2) - radius + strokeWidth, 15, 20, -30, 0]));
            triangle.attr("stroke-width", 0);
            triangle.attr("fill", "#fff");

            $(element).append($('<div class="pointer-value"></div>').append(valueDiv).append(unitsDiv));
        }

        this.onSettingsChanged = function (newSettings) {
            unitsDiv.html(newSettings.units);
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "direction") {
                if (!_.isUndefined(triangle)) {
                    var direction = "r";

                    var oppositeCurrent = currentValue + 180;

                    if (oppositeCurrent < newValue) {
                        //direction = "l";
                    }

                    triangle.animate({transform: "r" + newValue + "," + (width / 2) + "," + (height / 2)}, 250, "bounce");
                }

                currentValue = newValue;
            }
            else if (settingName == "value_text") {
                valueDiv.html(newValue);
            }
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return 4;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "pointer",
        display_name: "Pointer",
        "external_scripts" : [
            "freeboard/plugins/thirdparty/raphael.2.1.0.min.js"
        ],
        settings: [
            {
                name: "direction",
                display_name: "Direction",
                type: "calculated",
                description: "In degrees"
            },
            {
                name: "value_text",
                display_name: "Value Text",
                type: "calculated"
            },
            {
                name: "units",
                display_name: "Units",
                type: "text"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new pointerWidget(settings));
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

        // data format [{"name":"legend-1","values":[["x-value1", 1],["x-value2",2]]},{"name":"legend-2","values":[["x-value1",3],["x-value2",4]]}]
        function createBarGraph(allValues) {
            bargraphElement.empty();

            var legendLabels = [];
            var graphValues = [];
            allValues.forEach(function(value) {
                legendLabels.push(value.name);
                graphValues.push(value.values);
            });

            var barPadding = 5;
            var margin = {left: 40, right: 20, top: 20, bottom: 30};
            var longestGraphLength = d3.max(graphValues, function(graphValue){
                return graphValue.length;
            });
            var calculatedGraphLength = longestGraphLength * allValues.length;
            var barWidth = (bargraphElement[0].clientWidth * 0.65 - longestGraphLength * barPadding - margin.left - margin.right) / calculatedGraphLength;

            var svgWidth = (barWidth + barPadding) * longestGraphLength * graphValues.length;
            var svgHeight = bargraphElement[0].clientHeight;
            var xPosMultiple = svgWidth / longestGraphLength;
            var barSvg = d3.select(bargraphElement[0])
                .append("svg")
                .attr("width", (svgWidth + margin.left + margin.right) * 1.5)
                .attr("height", svgHeight +  margin.top + margin.bottom);

            var longestGraph = [];
            graphValues.forEach(function(graph){
                if (graph.length == longestGraphLength) {
                    longestGraph.push(graph);
                }
            });

            var axesLabels = [];
            longestGraph[0].forEach(function(pair){
                axesLabels.push(pair[0]);
            });

            var barYValues = [];
            graphValues.forEach(function(graphValue){
                var barYValue = [];
                graphValue.forEach(function(pair){
                    barYValue.push(pair[1]);
                });
                barYValues.push(barYValue);
            });

            var barColors = ["#a6ce00", "#009245", "#63B61C", "#31A430", "#88C30D", "#6BBBFD", "#3087EF", "#73C2FF"];
            var yValuesScale = d3.scale.linear()
                .domain([0, d3.max(_.flatten(barYValues))])
                .range([0,svgHeight]);

            barYValues.forEach(function(yValues, index){
                barSvg.append("g")
                    .attr("transform","translate(" + (margin.left + (barWidth * index)) + ",5)")
                    .selectAll("rect")
                    .data(yValues)
                    .enter()
                    .append("rect")
                    .attr("x", function(d, i){
                        return i * (xPosMultiple);
                    })
                    .attr("y", function(d){
                        return svgHeight - (yValuesScale(d));
                    })
                    .attr("width", barWidth)
                    .attr("height", function(d){
                        return yValuesScale(d);
                    })
                    .attr("fill", function(d){
                        return barColors[index % barColors.length];
                    });
            });

            var x_domain = [];
            longestGraph[0].forEach(function(pair){
                x_domain.push(pair[0]);
            });
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
                .attr("transform", "translate(" + (1.2 * svgWidth) + " ,0)")
                .attr("class", "legend");

            legend.selectAll("circle")
                .data(legendLabels)
                .enter()
                .append("circle")
                .attr("cx", 2)
                .attr("cy", function(d, i){
                    return (i + 1) * (0.15 * svgHeight);
                })
                .attr("r", (0.0225 * svgWidth))
                .style("fill", function(d, i){
                    return barColors[i];
                });

            legend.selectAll("text")
                .data(legendLabels)
                .enter()
                .append("text")
                .attr("x", 15 + 0.02 * svgWidth)
                .attr("y", function(d, i){
                    return (i + 1) * (0.15 * svgHeight);
                })
                .attr("dy", ".35em")
                .text(function(d){
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
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new bargraphWidget(settings));
        }
    });

	freeboard.addStyle('.indicator-light', "border-radius:50%;width:22px;height:22px;border:2px solid #3d3d3d;margin-top:5px;float:left;background-color:#222;margin-right:10px;");
	freeboard.addStyle('.indicator-light.on', "background-color:#FFC773;box-shadow: 0px 0px 15px #FF9900;border-color:#FDF1DF;");
	freeboard.addStyle('.indicator-text', "margin-top:10px;");
    var indicatorWidget = function (settings) {
        var self = this;
        var titleElement = $('<h2 class="section-title"></h2>');
        var stateElement = $('<div class="indicator-text"></div>');
        var indicatorElement = $('<div class="indicator-light"></div>');
        var currentSettings = settings;
        var isOn = false;

        function updateState() {
            indicatorElement.toggleClass("on", isOn);

            if (isOn) {
                stateElement.text((_.isUndefined(currentSettings.on_text) ? "" : currentSettings.on_text));
            }
            else {
                stateElement.text((_.isUndefined(currentSettings.off_text) ? "" : currentSettings.off_text));
            }
        }

        this.render = function (element) {
            $(element).append(titleElement).append(indicatorElement).append(stateElement);
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
            updateState();
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "value") {
                isOn = Boolean(newValue);
            }

            updateState();
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return 1;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "indicator",
        display_name: "Indicator Light",
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
                name: "on_text",
                display_name: "On Text",
                type: "calculated"
            },
            {
                name: "off_text",
                display_name: "Off Text",
                type: "calculated"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new indicatorWidget(settings));
        }
    });

    freeboard.addStyle('.gm-style-cc a', "text-shadow:none;");

    var googleMapWidget = function (settings) {
        var self = this;
        var currentSettings = settings;
        var map;
        var marker;
        var currentPosition = {};

        function updatePosition() {
            if (map && marker && currentPosition.lat && currentPosition.lon) {
                var newLatLon = new google.maps.LatLng(currentPosition.lat, currentPosition.lon);
                marker.setPosition(newLatLon);
                map.panTo(newLatLon);
            }
        }

        this.render = function (element) {
            function initializeMap() {
                var mapOptions = {
                    zoom: 13,
                    center: new google.maps.LatLng(37.235, -115.811111),
                    disableDefaultUI: true,
                    draggable: false,
                    styles: [
                        {"featureType": "water", "elementType": "geometry", "stylers": [
                            {"color": "#2a2a2a"}
                        ]},
                        {"featureType": "landscape", "elementType": "geometry", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 20}
                        ]},
                        {"featureType": "road.highway", "elementType": "geometry.fill", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 17}
                        ]},
                        {"featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 29},
                            {"weight": 0.2}
                        ]},
                        {"featureType": "road.arterial", "elementType": "geometry", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 18}
                        ]},
                        {"featureType": "road.local", "elementType": "geometry", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 16}
                        ]},
                        {"featureType": "poi", "elementType": "geometry", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 21}
                        ]},
                        {"elementType": "labels.text.stroke", "stylers": [
                            {"visibility": "on"},
                            {"color": "#000000"},
                            {"lightness": 16}
                        ]},
                        {"elementType": "labels.text.fill", "stylers": [
                            {"saturation": 36},
                            {"color": "#000000"},
                            {"lightness": 40}
                        ]},
                        {"elementType": "labels.icon", "stylers": [
                            {"visibility": "off"}
                        ]},
                        {"featureType": "transit", "elementType": "geometry", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 19}
                        ]},
                        {"featureType": "administrative", "elementType": "geometry.fill", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 20}
                        ]},
                        {"featureType": "administrative", "elementType": "geometry.stroke", "stylers": [
                            {"color": "#000000"},
                            {"lightness": 17},
                            {"weight": 1.2}
                        ]}
                    ]
                };

                map = new google.maps.Map(element, mapOptions);

                google.maps.event.addDomListener(element, 'mouseenter', function (e) {
                    e.cancelBubble = true;
                    if (!map.hover) {
                        map.hover = true;
                        map.setOptions({zoomControl: true});
                    }
                });

                google.maps.event.addDomListener(element, 'mouseleave', function (e) {
                    if (map.hover) {
                        map.setOptions({zoomControl: false});
                        map.hover = false;
                    }
                });

                marker = new google.maps.Marker({map: map});

                updatePosition();
            }

            if (window.google && window.google.maps) {
                initializeMap();
            }
            else {
                window.gmap_initialize = initializeMap;
                head.js("https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=gmap_initialize");
            }
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "lat") {
                currentPosition.lat = newValue;
            }
            else if (settingName == "lon") {
                currentPosition.lon = newValue;
            }

            updatePosition();
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return 4;
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "google_map",
        display_name: "Google Map",
        fill_size: true,
        settings: [
            {
                name: "lat",
                display_name: "Latitude",
                type: "calculated"
            },
            {
                name: "lon",
                display_name: "Longitude",
                type: "calculated"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new googleMapWidget(settings));
        }
    });

    freeboard.addStyle('.html-widget', "white-space:normal;width:100%;height:100%");

    var htmlWidget = function (settings) {
        var self = this;
        var htmlElement = $('<div class="html-widget"></div>');
        var currentSettings = settings;

        this.render = function (element) {
            $(element).append(htmlElement);
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "html") {
                htmlElement.html(newValue);
            }
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return Number(currentSettings.height);
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        "type_name": "html",
        "display_name": "HTML",
        "fill_size": true,
        "settings": [
            {
                "name": "html",
                "display_name": "HTML",
                "type": "calculated",
                "description": "Can be literal HTML, or javascript that outputs HTML."
            },
            {
                "name": "height",
                "display_name": "Height Blocks",
                "type": "number",
                "default_value": 4,
                "description": "A height block is around 60 pixels"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new htmlWidget(settings));
        }
    });

    var pointerID = 0;
    freeboard.addStyle('.pointer-widget-wrapper', "width: 100%;text-align: center;");
    freeboard.addStyle('.pointer-widget', "width:200px;height:160px;display:inline-block;");

    var pointerWidget = function (settings) {
        var self = this;

        var thisPointerID = "pointer-" + pointerID++;
        var titleElement = $('<h2 class="section-title"></h2>');
        var pointerElement = $('<div class="pointer-widget" id="' + thisPointerID + '"></div>');
        var infoBarElement = $('<div class="infobar"></div>');
        var thisInfoBar =  ".infobar #infobar-value";

        var pointerObject;
        var rendered = false;

        var currentSettings = settings;

        function createGauge(currentSettings) {
            if (!rendered) {
                return;
            }

            pointerElement.empty();
            infoBarElement.empty();

            var units_label = (_.isUndefined(currentSettings.units_label) ? 'Power' : currentSettings.units_label);
            var units = (_.isUndefined(currentSettings.units) ? 'kW' : currentSettings.units);

            var infoBarNameElement = $('<span id="infobar-name"> ' + units_label + '</span>');
            var infoBarValueElement = $('<span class="value" id="infobar-value">0.00</span>');
            var infoBarUnitsElement = $('<span id="infobar-units"> ' + units + '</span>');

            var config =
            {
                size: 200,
                clipWidth: 200,
                clipHeight: 120,
                ringWidth: 40,
                transitionMs: 4000,
                minValue: (_.isUndefined(currentSettings.min_value) ? 0 : currentSettings.min_value),
                maxValue: (_.isUndefined(currentSettings.max_value) ? 10 : currentSettings.max_value)
            };

            pointerObject = new PointerGauge(thisPointerID, config);
            pointerObject.render();

            $(pointerElement).append(infoBarElement);
            $(infoBarElement).append(infoBarNameElement, ": ", infoBarValueElement, infoBarUnitsElement);
        }

        this.render = function (element) {
            rendered = true;

            $(element).append(titleElement).append($('<div class="pointer-widget-wrapper"></div>').append(pointerElement));
            createGauge(settings);
        }

        this.onSettingsChanged = function (newSettings) {
            if (newSettings.title != currentSettings.title ||
                newSettings.min_value != currentSettings.min_value ||
                newSettings.max_value != currentSettings.max_value ||
                newSettings.units_label != currentSettings.units_label ||
                newSettings.units != currentSettings.units) {
                currentSettings = newSettings;
                createGauge(newSettings);
            }
            else {
                currentSettings = newSettings;
            }

            titleElement.html(newSettings.title);
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (!_.isUndefined(pointerObject)) {
                pointerObject.update(Number(newValue));
                pointerElement.find(thisInfoBar).html(newValue);
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
        type_name: "pointer",
        display_name: "Pointer Gauge",
        "external_scripts": [
            "js/d3.min.js",
            "freeboard/plugins/thirdparty/pointergauge.js"
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
                name: "min_value",
                display_name: "Minimum",
                type: "text",
                default_value: 0
            },
            {
                name: "max_value",
                display_name: "Maximum",
                type: "text",
                default_value: 10
            },
            {
                name: "units_label",
                display_name: "Measurement Type",
                type: "text",
                default_value: "Power"
            },
            {
                name: "units",
                display_name: "Measurement Unit",
                type: "text",
                default_value: "kW"
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new pointerWidget(settings));
        }
    });

}());
