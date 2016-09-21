import Chart from './chart';
import * as d3 from 'd3';

class Chord extends Chart {

    constructor(options) {
        super(options);
    }

    appendTo(dom) {
        dom.innerHTML = '';

        var matrix = [
            [11975,  5871, 8916, 2868],
            [1951, 10048, 2060, 6171],
            [8010, 16145, 8090, 8045],
            [1013,   990,  940, 6907]
        ];

        let innerRadius = 225;
        let outerRadius = 250;

        let arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius)

        let ribbon = d3.ribbon().radius(innerRadius);

        let color = d3.scaleOrdinal()
            .domain(d3.range(4))
            .range(["#000000", "#FFDD89", "#957244", "#F26223"]);

        let chord = d3
            .chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending);

        let chords = chord(matrix);

        // let data = [ 5, 10, 15, 20, 25 ];
        let svg = d3.select(dom).append('svg').attr('width', 500).attr('height', 500);
        let g = svg.append('g')
            .attr('transform', 'translate(250, 250)')
            .datum(chords);

        let group = g.append("g")
            .attr("class", "groups")
            .selectAll("g")
            .data(function(chords) { return chords.groups; })
            .enter()
            .append("g");

        group.append("path")
            .style("fill", function(d) { return color(d.index); })
            .style("stroke", function(d) { return d3.rgb(color(d.index)).darker(); })
            .attr("d", arc);

        // svg.selectAll('rect')
        //     .data(data)
        //     .enter()
        //     .append('rect')
        //     .attr('width', function () {
        //         return 20;
        //     })
        //     .attr('height', function (d, i) {
        //         return d * 5;
        //     })
        //     .attr('x', function (d, i) {
        //         return 21 * i;
        //     });



        // chords.groups.forEach(item => {
        //     let arcPath = d3.arc()
        //         .innerRadius(innerRadius)
        //         .outerRadius(outerRadius)
        //         .startAngle(item.startAngle)
        //         .endAngle(item.endAngle);

        //     g.append('path').attr('d', arcPath());
        // });

        // chords.forEach(item => {
        //     let radius = 225;
        //     let ribbon = d3.ribbon().radius(radius);
        //     let ribbonPath = ribbon(item);
        //     g.append('path').attr('d', ribbonPath);
        // });

        this.svg = svg;
    }
}

export function start() {

    let chord = new Chord({
        a: 1,
        b: 2
    });

    chord.appendTo($('#main')[0]);
}
