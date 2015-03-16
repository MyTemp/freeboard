// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function () {
	var jsonDatasource = function (settings, updateCallback) {
		var self = this;
		var updateTimer = null;
		var currentSettings = settings;
		var errorStage = 0; 	// 0 = try standard request
		// 1 = try JSONP
		// 2 = try thingproxy.freeboard.io
		var lockErrorStage = false;

		function updateRefresh(refreshTime) {
			if (updateTimer) {
				clearInterval(updateTimer);
			}

			updateTimer = setInterval(function () {
				self.updateNow();
			}, refreshTime);
		}

		updateRefresh(currentSettings.refresh * 1000);

		this.updateNow = function () {
			if ((errorStage > 1 && !currentSettings.use_thingproxy) || errorStage > 2) // We've tried everything, let's quit
			{
				return; // TODO: Report an error
			}

			var requestURL = currentSettings.url;

			if (errorStage == 2 && currentSettings.use_thingproxy) {
				requestURL = (location.protocol == "https:" ? "https:" : "http:") + "//thingproxy.freeboard.io/fetch/" + encodeURI(currentSettings.url);
			}

			var body = currentSettings.body;

			// Can the body be converted to JSON?
			if (body) {
				try {
					body = JSON.parse(body);
				}
				catch (e) {
				}
			}

			$.ajax({
				url: requestURL,
				dataType: (errorStage == 1) ? "JSONP" : "JSON",
				type: currentSettings.method || "GET",
				data: body,
				beforeSend: function (xhr) {
					try {
						_.each(currentSettings.headers, function (header) {
							var name = header.name;
							var value = header.value;

							if (!_.isUndefined(name) && !_.isUndefined(value)) {
								xhr.setRequestHeader(name, value);
							}
						});
					}
					catch (e) {
					}
				},
				success: function (data) {
					lockErrorStage = true;
					updateCallback(data);
				},
				error: function (xhr, status, error) {
					if (!lockErrorStage) {
						// TODO: Figure out a way to intercept CORS errors only. The error message for CORS errors seems to be a standard 404.
						errorStage++;
						self.updateNow();
					}
				}
			});
		}

		this.onDispose = function () {
			clearInterval(updateTimer);
			updateTimer = null;
		}

		this.onSettingsChanged = function (newSettings) {
			lockErrorStage = false;
			errorStage = 0;

			currentSettings = newSettings;
			updateRefresh(currentSettings.refresh * 1000);
			self.updateNow();
		}
	};

	freeboard.loadDatasourcePlugin({
		type_name: "JSON",
		settings: [
			{
				name: "url",
				display_name: "URL",
				type: "text"
			},
			{
				name: "use_thingproxy",
				display_name: "Try thingproxy",
				description: 'A direct JSON connection will be tried first, if that fails, a JSONP connection will be tried. If that fails, you can use thingproxy, which can solve many connection problems to APIs. <a href="https://github.com/Freeboard/thingproxy" target="_blank">More information</a>.',
				type: "boolean",
				default_value: true
			},
			{
				name: "refresh",
				display_name: "Refresh Every",
				type: "number",
				suffix: "seconds",
				default_value: 5
			},
			{
				name: "method",
				display_name: "Method",
				type: "option",
				options: [
					{
						name: "GET",
						value: "GET"
					},
					{
						name: "POST",
						value: "POST"
					},
					{
						name: "PUT",
						value: "PUT"
					},
					{
						name: "DELETE",
						value: "DELETE"
					}
				]
			},
			{
				name: "body",
				display_name: "Body",
				type: "text",
				description: "The body of the request. Normally only used if method is POST"
			},
			{
				name: "headers",
				display_name: "Headers",
				type: "array",
				settings: [
					{
						name: "name",
						display_name: "Name",
						type: "text"
					},
					{
						name: "value",
						display_name: "Value",
						type: "text"
					}
				]
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new jsonDatasource(settings, updateCallback));
		}
	});

	var clockDatasource = function (settings, updateCallback) {
		var self = this;
		var currentSettings = settings;
		var timer;

		function stopTimer() {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
		}

		function updateTimer() {
			stopTimer();
			timer = setInterval(self.updateNow, currentSettings.refresh * 1000);
		}

		this.updateNow = function () {
			var date = new Date();

			var data = {
				numeric_value: date.getTime(),
				full_string_value: date.toLocaleString(),
				date_string_value: date.toLocaleDateString(),
				time_string_value: date.toLocaleTimeString(),
				date_object: date
			};

			updateCallback(data);
		}

		this.onDispose = function () {
			stopTimer();
		}

		this.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;
			updateTimer();
		}

		updateTimer();
	};

	freeboard.loadDatasourcePlugin({
		"type_name": "clock",
		"display_name": "Clock",
		"settings": [
			{
				"name": "refresh",
				"display_name": "Refresh Every",
				"type": "number",
				"suffix": "seconds",
				"default_value": 1
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new clockDatasource(settings, updateCallback));
		}
	});

}());
// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
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

	freeboard.addStyle('@keyframes alarm-indicator-blink', 'from{color:#f88;}25%{color:#f00;}to{color:#800;}');
	freeboard.addStyle('@-webkit-keyframes alarm-indicator-blink', 'from{color:#f88;}25%{color:#f00;}to{color:#800;}');
	freeboard.addStyle('.alarm-indicator', 'color:#ddd;width:36px;height:36px;display:inline-block;vertical-align:-5px;margin-right:10px;margin-top:5px');
	freeboard.addStyle('.alarm-indicator-text', 'width:40px;font-weight:bold;text-align:center;margin-right:10px');
	freeboard.addStyle('.on>.alarm-indicator, .on>.alarm-indicator-text', 'animation-duration:1s;animation-name:alarm-indicator-blink;animation-iteration-count:infinite;');
	freeboard.addStyle('.on>alarm-indicator, .on>.alarm-indicator-text', '-webkit-animation-duration:1s;-webkit-animation-name:alarm-indicator-blink;-webkit-animation-iteration-count:infinite;');
	freeboard.addStyle('.alarm-indicator-text, .alarm-indicator-name', 'display:inline-block;');
	freeboard.addStyle('.alarm-indicator-tooltip', 'position:absolute;display:inline-block;padding:10px;border-radius:10px;color:#000;background-color:#fff;box-shadow:0 2px 2px 0 rgba(0,0,0,0.5)');

	$(document).tooltip({
		items: '[data-alarm-indicator-tooltip]',
		content: function () {
			return $(this).attr('data-alarm-indicator-tooltip');
		},
		tooltipClass: 'alarm-indicator-tooltip',
		position: {
			my: "center top",
			at: "center bottom+5px"
		}
	});

	var activeAlarms = ko.observableArray([]);
	activeAlarms.extend({throttle: 50});
	var uninitialisedAlarms = ko.observableArray([]);
	uninitialisedAlarms.extend({throttle: 50});

	var alarmIndicatorWidget = function (settings) {
		var self = this;
		var viewModel = {
			value: ko.observable(null),
			changeTime: ko.observable(null),
			onText: ko.observable(''),
			offText: ko.observable(''),
			name: ko.observable(''),
			iconId: ko.observable(''),
			tooltipHtml: ko.observable('')
		};

		viewModel.text = ko.computed(function () {
			if (viewModel.value() === null) {
				return "—";
			} else if (viewModel.value()) {
				return viewModel.onText();
			} else {
				return viewModel.offText();
			}
		});

		uninitialisedAlarms.push(viewModel);

		viewModel.value.subscribe(function (on) {
			if (on !== null) {
				uninitialisedAlarms.remove(viewModel);
			}
			if (on) {
				activeAlarms.push(viewModel);
			} else {
				activeAlarms.remove(viewModel);
			}
		});

		this.render = function (element) {
			var view = $('<div data-bind="css: {on: model.value()}, attr: {\'data-alarm-indicator-tooltip\': model.tooltipHtml()}">'+
						 '<i class="i0 alarm-indicator" data-bind="css: \'i0-\' + model.iconId()"></i>'+
						 '<div class="alarm-indicator-text" data-bind="text: model.text"></div>'+
						 '<div class="alarm-indicator-name" data-bind="text: model.name"></div>'+
						 '</div>');
			$(element).append(view);
			return viewModel;
		};

		this.onSettingsChanged = function (newSettings) {
			viewModel.iconId(newSettings.iconId);
			viewModel.tooltipHtml(newSettings.tooltipHtml);
		};

		this.onCalculatedValueChanged = function (settingName, newValue) {
			viewModel[settingName](newValue);
		};

		this.getHeight = function () {
			return 1;
		};

		this.onSettingsChanged(settings);
	};

	freeboard.loadWidgetPlugin({
		type_name: "alarm_indicator",
		display_name: "Alarm Indicator",
		settings: [
			{
				name: "value",
				display_name: "Value",
				type: "calculated"
			},
			{
				name: "changeTime",
				display_name: "Time of Last Change",
				type: "calculated"
			},
			{
				name: "onText",
				display_name: "On Text",
				type: "calculated"
			},
			{
				name: "offText",
				display_name: "Off Text",
				type: "calculated"
			},
			{
				name: "name",
				display_name: "Name Text",
				type: "calculated"
			},
			{
				name: "iconId",
				display_name: "Icon ID",
				type: "text"
			},
			{
				name: "tooltipHtml",
				display_name: "Tooltip HTML",
				type: "text"
			}
		],
		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new alarmIndicatorWidget(settings));
		}
	});

	freeboard.addStyle(".alarm-overview", "white-space:normal;line-height:50px;text-overflow:ellipsis;");
	freeboard.addStyle(".alarm-overview-summary", "font-weight:bold;margin-right:15px");
	freeboard.addStyle(".alarm-overview-item", "display:none;margin-right:15px");
	freeboard.addStyle(".alarm-overview-item.on", "display:inline-block;");

	var alarmOverviewWidget = function (settings) {
		var self = this;
		var container = $('<div class="alarm-overview" data-bind="with: model">'+
						  '<span class="alarm-overview-wait" data-bind="if: uninitialisedAlarms().length">Hämtar data …</span>'+
						  '<span data-bind="if: !uninitialisedAlarms().length">'+
						  '<span class="alarm-overview-summary" data-bind="visible: sortedAlarms().length, text: sortedAlarms().length + \' larm\'"></span>'+
						  '<span class="alarm-overview-empty" data-bind="if: !sortedAlarms().length">Inga larm</span>'+
						  '<span data-bind="foreach: sortedAlarms">'+
						  '<div class="alarm-overview-item" data-bind="css: {on: value}, attr: {\'data-alarm-indicator-tooltip\': tooltipHtml()}">'+
						  '<i class="i0 alarm-indicator" data-bind="css: \'i0-\' + iconId()"></i><span data-bind="text: name"></span>'+
						  '</div>'+
						  '</span>'+
						  '</div>');
		var viewModel = {
			uninitialisedAlarms: uninitialisedAlarms,
			sortedAlarms: ko.observableArray([])
		};
		viewModel.sortedAlarms.extend({ throttle: 50 });

		activeAlarms.subscribe(function (alarms) {
			alarms.sort(function (a, b) {
				if (a.changeTime() < b.changeTime()) {
					return 1;
				} else if (a.changeTime() === b.changeTime()) {
					return 0;
				} else {
					return -1;
				}
			});
			viewModel.sortedAlarms(alarms);
		});

		this.render = function (element) {
			$(element).append(container);
			return viewModel;
		};

		this.getHeight = function () {
			return 2;
		};
	};

	freeboard.loadWidgetPlugin({
		type_name: "alarm_overview",
		display_name: "Alarm Overview",
		settings: [],
		newInstance: function (settings, newInstanceCallback) {
			newInstanceCallback(new alarmOverviewWidget(settings));
        }
    });
}());
