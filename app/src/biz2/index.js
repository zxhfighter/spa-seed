import $ from 'jquery';
import * as d3 from 'd3';
import * as scaleChromatic from 'd3-scale-chromatic';

export function start() {
    $('#main').html('');

    // 生成 8 种颜色
    var color = d3.scaleOrdinal(scaleChromatic.schemeAccent);
    var color2 = d3.scaleOrdinal(scaleChromatic.schemePaired);

    let svg = d3.select('#main').append('svg').attr('width', 900).attr('height', 200);

    let rects = svg.append('g').selectAll('rect')
        .data(d3.range(0, 8))
        .enter()
        .append('rect')
        .style('width', 50)
        .style('height', 20)
        .style('x', (d, i) => {
            return i * 50;
        })
        .style('fill', (d, i) => {
            return color(i);
        });

    let rects2 = svg.append('g').attr('transform', 'translate(0, 30)').selectAll('rect')
        .data(d3.range(0, 12))
        .enter()
        .append('rect')
        .style('width', 50)
        .style('height', 20)
        .style('x', (d, i) => {
            return i * 50;
        })
        .style('fill', (d, i) => {
            return color2(i);
        });
}
