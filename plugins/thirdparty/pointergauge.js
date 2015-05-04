/**
 * @project: d3 Gauge https://gist.github.com/msqr/3202712
 * @license: MIT
 * @author Matt Magoffin - https://github.com/msqr
 * @source: https://gist.github.com/3202712.git
 * @sha1sum: 663858a8bb351f511093c75c373e653eec4d5997 index.html
 * @date: 2015-05-04
 *
 * Copyright (c) 2012 Matt Magoffin - github.com(at)msqr(dot)us
 */

PointerGauge = function (placeholderName, configuration) {
    this.placeholderName = placeholderName;
    var self = this;
    var that = {};

    var config = {
        size: 200,
        clipWidth: 200,
        clipHeight: 110,
        ringInset: 20,
        ringWidth: 20,

        pointerWidth: 10,
        pointerTailLength: 5,
        pointerHeadLengthPercent: 0.9,

        minValue: 0,
        maxValue: 10,

        transitionMs: 750,
        majorTicks: 5, // # colour interpolations
        labelFormat: d3.format(',g'),
        labelInset: 15, // tick labels

        arcColourFn: d3.interpolateHsl(d3.rgb('#a0cc02'), d3.rgb('#009245'))
    };

    var minAngle = -90;
    var maxAngle = 90;

    var range = undefined;
    var r = undefined;
    var pointerHeadLength = undefined;
    var value = 0;

    var svg = undefined;
    var arc = undefined;
    var scale = undefined;
    var ticks = undefined;
    var tickData = undefined;
    var pointer = undefined;

    var donut = d3.layout.pie();

    function deg2rad(deg) {
        return deg * Math.PI / 180;
    }

    function newAngle(d) {
        var ratio = scale(d);
        var newAngle = minAngle + (ratio * range);
        return newAngle;
    }

    function configure(configuration) {
        var prop = undefined;
        for (prop in configuration) {
            config[prop] = configuration[prop];
        }

        // semi-circle
        range = maxAngle - minAngle;
        r = config.size / 2;
        pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

        // a linear scale that maps domain values to a percent from 0..1
        scale = d3.scale.linear()
            .range([0, 1])
            .domain([config.minValue, config.maxValue]);

        ticks = scale.ticks(config.majorTicks);
        tickData = d3.range(config.majorTicks).map(function () {
            return 1 / config.majorTicks;
        });

        arc = d3.svg.arc()
            .innerRadius(r - config.ringWidth - config.ringInset)
            .outerRadius(r - config.ringInset)
            .startAngle(function (d, i) {
                var ratio = d * i;
                return deg2rad(minAngle + (ratio * range));
            })
            .endAngle(function (d, i) {
                var ratio = d * (i + 1);
                return deg2rad(minAngle + (ratio * range));
            });
    }

    that.configure = configure;

    function centerTranslation() {
        return 'translate(' + r + ',' + r + ')';
    }

    function isRendered() {
        return (svg !== undefined);
    }

    that.isRendered = isRendered();

    function render(newValue) {
        svg = d3.select(placeholderName)
            .append('svg:svg')
            .attr('class', 'gauge')
            .attr('width', config.clipWidth)
            .attr('height', config.clipHeight);

        var centerTx = centerTranslation();

        var arcs = svg.append('g')
            .attr('class', 'arc')
            .attr('transform', centerTx);

        arcs.selectAll('path')
            .data(tickData)
            .enter()
            .append('path')
            .attr('fill', function (d, i) {
                return config.arcColourFn(d * i);
            })
            .attr('d', arc);

        var lg = svg.append('g')
            .attr('class', 'label')
            .attr('transform', centerTx);
        lg.selectAll('text')
            .data(ticks)
            .enter()
            .append('text')
            .attr('transform', function (d) {
                var ratio = scale(d);
                var newAngle = minAngle + (ratio * range);
                return 'rotate(' + newAngle + ') translate(0,' + (config.labelInset - r) + ')';
            })
            .text(config.labelFormat);

        var lineData = [[config.pointerWidth / 2, 0],
            [0, -pointerHeadLength],
            [-(config.pointerWidth / 2), 0],
            [0, config.pointerTailLength],
            [config.pointerWidth / 2, 0]];
        var pointerLine = d3.svg.line().interpolate('monotone');
        var pg = svg.append('g').data([lineData])
            .attr('class', 'pointer')
            .attr('transform', centerTx);

        pointer = pg.append('path')
            .attr('d', pointerLine)
            .attr('fill', '#005ce3')
            .attr('stroke', function () {
                return d3.interpolateLab('#005ce3', '#73c2ff');
            })
            .attr('transform', 'rotate(' + minAngle + ')');

        update(newValue === undefined ? 0 : newValue);
    }

    that.render = render;

    function update(newValue, newConfiguration) {
        if (newConfiguration !== undefined) {
            configure(newConfiguration);
        }
        var ratio = scale(newValue);
        var newAngle = minAngle + (ratio * range);
        pointer.transition()
            .duration(config.transitionMs)
            .ease('elastic')
            .attr('transform', 'rotate(' + newAngle + ')');
    }

    that.update = update;

    configure(configuration);

    return that;
};