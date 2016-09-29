/**
 * @file interpolate values may be
 *       - numbers
 *       - colors
 *       - strings
 *       - arrays
 *       - even deeply-nested objects
 *
 * @author zengxiaohui(zengxiaohui@baidu.com)
 */

import './index.less';

import $ from 'jquery';
import * as d3 from 'd3';
import Util from '../common/util';

export function start() {
    $('#main').html('');

    // numbers
    let i = d3.interpolateNumber(10, 20);
    let points = [0, 0.2, 0.5, 0.8, 1.0];
    d3.select('#main')
        .selectAll('p')
        .data(points)
        .enter()
        .append('p')
        .text(item => {
            return `i(${item}) = ` + i(item);
        });

    // colors
    console.log(d3.interpolateLab('steelblue', 'brown')(0.5));
    console.log(d3.interpolate({colors: ['red', 'blue']}, {colors: ['white', 'black']}));
}