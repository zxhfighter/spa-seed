import './index.less';

import * as d3 from 'd3';
import Util from '../common/util';

export function start() {
    $('#main').html('');

    let width = 600;
    let height = 600;
    let padding = {
        top: 40,
        right: 40,
        bottom: 40,
        left: 100
    };
    let innerWidth = width - padding.left - padding.right;
    let innerHeight = height - padding.top - padding.bottom;

    let x = d3.scaleLinear().range([0, innerWidth]);
    let y = d3.scaleLinear().range([innerHeight, 0]);

    let svg = Util.createSVG('#main', width, height).attr('class', 'd3-svg');
    let g = svg.append('g').attr('transform', `translate(${padding.left}, ${padding.top})`);

    g.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(x).tickSize(-innerHeight).tickPadding(6))
        .append('text')
        .attr('class', 'axis-title')
        .attr('x', innerWidth - 10)
        .attr('y', 6)
        .attr('dy', '.71em')
        .attr('text-anchor', 'end')
        .attr('font-weight', 'bold')
        .style('fill', '#333')
        .text('t = ');

    g.append('g')
        .attr('class', 'axis axis--y')
        .call(d3.axisLeft(y).tickSize(-innerWidth).tickPadding(6))
        .append('text')
        .attr('class', 'axis-title')
        .attr('x', -24)
        .attr('y', -4)
        .attr('dy', '.71em')
        .attr('text-anchor', 'end')
        .attr('font-weight', 'bold')
        .style('fill', '#333')
        .text('ease(t) = ');

    let line = g.append('g').attr('class', 'line').append('path')
        .datum(d3.range(0, 1, 0.002).concat(1));

    // let path = d3.line().x(t => x(t)).y(t => y(ease(t)));

    let dot1 = g.append('circle').attr('r', 5).attr('fill', '#f00');
    let dot2 = g.append('circle').attr('cx', innerWidth).attr('r', 5).attr('fill', '#f00');
    let dot3 = g.append('circle').attr('cy', 0).attr('r', 5).attr('fill', '#f00');

    let path = d3.line().x(t => x(t)).y(t => y(d3.easeSinIn(t)));
    line.attr('d', path);

    d3.timer(elapsed => {
        let t = (elapsed % 3000) / 3000;
        dot1.attr('cx', x(t)).attr('cy', y(d3.easeSinIn(t)));
        dot2.attr('cy', y(d3.easeSinIn(t)));
        dot3.attr('cx', x(t));
    });
}
