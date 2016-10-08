/**
 * @file 转移图
 * @author zengxiaohui(zengxiaohui@baidu.com)
 */

import Chart from './chart';
import Util from '../common/util';

import _extend from 'lodash-es/extend';

import {select as d3Select} from 'd3-selection';

/**
 * 默认参数
 *
 * @type {Object}
 */
const defaultOptions = {

    // 默认挂载元素, 例如 '#main'
    el: 'body',

    // 图形宽和高
    width: 480,
    height: 480,

    // 节点最小半径和最大半径
    R_MIN: 10,
    R_MAX: 30,

    // 数据
    data: {
        label: ['天极', '网易', 'acsis', 'new balance', 'nike', '百度', 'adidas'],

        // 各自占比
        share: [100, 40, 50, 20, 86, 30, 29],

        // 转移概率
        ratio: [
            [0.23, 0.45, 0.21, 0.45, 0.76, 0.27, 0.22],
            [0.86, 0.65, 0.21, 0.45, 0.90, 0.23, 0.33],
            [0.97, 0.44, 0.21, 0.66, 0.19, 0.45, 0.44],
            [0.23, 0.98, 0.21, 0.33, 0.23, 0.60, 0.55],
            [0.23, 0.22, 0.21, 0.22, 0.90, 0.23, 0.66],
            [0.87, 0.53, 0.21, 0.11, 0.22, 0.27, 0.77],
            [0.11, 0.22, 0.33, 0.44, 0.55, 0.66, 0.77]
        ]
    },

    // 颜色图谱
    colors: [
        '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c',
        '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ff9', '#b15928'
    ],

    // 模式
    // - from: 从该节点出发，箭头指向其他节点
    // - to: 其他节点汇聚到该节点，箭头均指向该节点
    mode: 'from'
};

class Transfer extends Chart {

    /**
     * 构造函数
     *
     * @param  {Object} options 参数
     */
    constructor(options) {
        super();

        this.options = _extend({}, defaultOptions, options);
        this.init();
    }

    /**
     * 初始化
     */
    init() {

        // 创建SVG
        [this.svg, this.svgGroup] = this.createSVG();

        // 创建箭头
        this.arrowMarker = this.createArrowMarker();

        // 画圆
        [this.circles, this.points, this.labels] = this.createCircles();

        // 画线
        this.lines = this.createLines();

        // 画线上的标签
        this.createLineLabels();

        // 默认从第一个节点发散
        this[this.options.mode](0);
    }

    createLineLabels() {
        let g = this.svgGroup;
        let lines = this.lines;
        let points = this.points;
        let {data, colors} = this.options;
        let {ratio} = data;

        let newGroup = g.append('g')
        newGroup.selectAll('text')
            .data(lines)
            .enter()
            .append('text')
            .attr('x', (d, i) => {
                // d.i, d.j, d.line
                let x = (points[d.i].x + points[d.j].x) / 2;
                d.line.labelX = x;
                return x;
            })
            .attr('y', (d, i) => {
                let y = (points[d.i].y + points[d.j].y) / 2;
                d.line.labelY = y;
                return y;
            })
            .text((d, i, aaa) => {
                d.line.label = d3Select(aaa[i]);
                return ratio[d.i][d.j];
            })
            .style('text-anchor', 'middle');
    }

    createArrowMarker() {
        let defs = this.svg.append('defs');
        let arrowMarker = defs.append('marker');

        Util.attr(arrowMarker, {
            id: 'arrow',
            markerUnits: 'strokeWidth',
            markerWidth: 12,
            markerHeight: 12,
            viewBox: '0 0 12 12',
            refX: 20,
            refY: 6,
            orient: 'auto'
        });

        let arrowPath = arrowMarker.append('path')
            .attr('d', 'M2,2 L10,6 L2,10 L6,6 L2,2')
            .attr('fill', '#ccc');

        arrowMarker.path = arrowPath;
        return arrowMarker;
    }

    to(index) {
        let {colors} = this.options;
        let circles = this.circles.nodes();

        this.lines.forEach((item, i) => {

            // 找到到达 index 节点的线条
            if (item.j === index) {
                item.line.attr('opacity', 1);
                item.line.label.attr('opacity', 1).attr('fill', colors[index]);
                item.line.attr('stroke', colors[index]).attr('stroke-width', 1);
                d3Select(circles[index]).attr('stroke', '#fe0').attr('stroke-width', 3);
                this.arrowMarker.path.attr('fill', colors[index]);
            }
            else {
                item.line.attr('opacity', 0);
                item.line.label.attr('opacity', 0);
                d3Select(circles[item.j]).attr('stroke', 'none');
            }
        });
    }

    from(index) {
        let {colors} = this.options;
        let circles = this.circles.nodes();
        this.lines.forEach((item, i) => {
            // item.i, item.j, item.line
            if (item.i !== index) {
                item.line.attr('opacity', 0);
                item.line.label.attr('opacity', 0);
                this.arrowMarker.path.attr('fill', '#ccc');
                d3Select(circles[item.i]).attr('stroke', 'none');
            }
            else {
                item.line.attr('opacity', 1);
                item.line.label.attr('opacity', 1).attr('fill', colors[index]);
                this.arrowMarker.path.attr('fill', colors[index]);
                d3Select(circles[index]).attr('stroke', '#fe0').attr('stroke-width', 3);
                item.line.attr('stroke', colors[index]).attr('stroke-width', 1);
            }
        });
    }

    createCircles() {
        let {data, width, height, R_MAX, R_MIN, colors} = this.options;
        let {share, label} = data;

        let angleSpan = 2 * Math.PI / share.length;
        let padding = 20;
        let r = Math.min(width / 2, height / 2) - R_MAX - padding;
        let min = Math.min(...share);
        let max = Math.max(...share);

        let points = [];
        let circles = this.svgGroup.selectAll('circle')
            .data(share)
            .enter()
            .append('circle')
            .attr('cx', (d, i) => {
                let cx = r * Math.cos(angleSpan * i);

                !points[i] && (points[i] = {});
                points[i].x = cx;
                return cx;
            })
            .attr('cy', (d, i) => {
                let cy = r * Math.sin(angleSpan * i);
                points[i].y = cy;
                return cy;
            })
            .attr('r', (d, i) => {
                let norm = Util.normalize(d, min, max);
                let cr = R_MIN + Math.floor((R_MAX - R_MIN) * norm);
                points[i].r = cr;
                return cr;
            })
            .attr('fill', (d, i) => {
                return colors[i];
            })
            .style('cursor', 'pointer');

        circles.on('click', this.onCircleClick.bind(this));

        let texts = this.svgGroup.selectAll('text')
            .data(label)
            .enter()
            .append('text')
            .attr('x', (d, i) => {
                return points[i].x;
            })
            .attr('y', (d, i) => {
                let marginBottom = 5;
                return points[i].y - points[i].r - marginBottom;
            })
            .text(d => d)
            .style('fill', (d, i) => colors[i])
            .style('font-size', '12px')
            .style('text-anchor', 'middle');


        return [circles, points, texts];
    }

    onCircleClick(data, i) {
        this[this.options.mode](i);
    }

    createLines() {
        let {data, colors} = this.options;
        let {ratio} = data;
        let points = this.points;
        let g = this.svgGroup;
        let lines = [];

        points.forEach((item, i) => {
            points.forEach((nextItem, j) => {

                if (i !== j) {
                    let line = g.append('line')
                        .attr('x1', item.x)
                        .attr('y1', item.y)
                        .attr('x2', nextItem.x)
                        .attr('y2', nextItem.y)
                        .attr('stroke', '#ccc')
                        .attr('marker-end', 'url("#arrow")');

                    lines.push({i, j, line});
                }
            });
        });

        return lines;
    }

    /**
     * 创建SVG容器以及移动坐标轴的g元素
     *
     * @return {Array.<Selection>} SVG容器以及移动坐标轴的g元素
     */
    createSVG() {
        let {width, height, el} = this.options;
        let svg = Util.createSVG(el, width, height).attr('class', 'd3-svg');

        // 这两个参数用来调整与背景图片的中心对齐
        let x0 = width / 2;
        let y0 = height / 2;

        // 移动原点坐标到中心点(x0, y0)
        let root = svg.append('g').attr('transform', `translate(${x0}, ${y0})`);

        // 返回 svg 和 root 元素
        return [svg, root];
    }

    /**
     * 销毁
     */
    dispose() {

    }
}

export function start() {
    document.querySelector('#main').innerHTML = '';

    new Transfer({
        el: '#main'
    });
}
