/**
 * @file 转移图
 * @author zengxiaohui(zengxiaohui@baidu.com)
 */

import "./transfer.less";

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

    // 线条最大宽度和最小宽度
    LINE_WIDTH_MAX: 5,
    LINE_WIDTH_MIN: 1,

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

        // 创建提示
        this.tooltip = this.createTooltip();

        // 画线
        this.lines = this.createLines();

        // 画线上的标签
        this.createLineLabels();

        // 默认从第一个节点发散
        this[this.options.mode](0);
    }

    /**
     * 创建提示框
     *
     * @return {Selection} 提示框(div)
     */
    createTooltip() {
        if (this.tooltip) {
            return this.tooltip;
        }

        let tooltipHeight = 30;
        let tooltip = d3Select('body').append('div')
            .attr('class', 'transfer-tool-tip')
            .style('height', tooltipHeight + 'px')
            .style('line-height', tooltipHeight + 'px')
            .style('top', top + 'px');

        tooltip.on('mouseover', () => {
            clearTimeout(this.timer);
        });

        tooltip.on('mouseout', () => {
            this.timer = setTimeout(() => {
                tooltip.style('display', 'none');
            }, 2000);
        });

        return tooltip;
    }

    /**
     * 创建线条提示文字，居中显示
     *
     * @return {Selection} 文本集合(text)
     */
    createLineLabels() {
        let g = this.svgGroup;
        let lines = this.lines;
        let points = this.points;
        let {data} = this.options;
        let {ratio} = data;

        let newGroup = g.append('g')
        return newGroup.selectAll('text')
            .data(lines)
            .enter()
            .append('text')
            .attr('x', d => {
                let x = (points[d.i].x + points[d.j].x) / 2;
                d.line.labelX = x;
                return x;
            })
            .attr('y', d => {
                let y = (points[d.i].y + points[d.j].y) / 2;
                d.line.labelY = y;
                return y;
            })
            .text((d, i, arr) => {
                d.line.label = d3Select(arr[i]);

                let sum = ratio[d.i].reduce((a, b) => a + b, 0);
                return (ratio[d.i][d.j] / sum * 100).toFixed(2) + '%';
            })
            .style('font-size', '12px')
            .style('text-anchor', 'middle');
    }

    /**
     * 创建箭头标记
     *
     * @return {Selection} 箭头标记(marker)
     */
    createArrowMarker() {
        let defs = this.svg.append('defs');
        let arrowMarker = defs.append('marker');

        Util.attr(arrowMarker, {
            id: 'arrow',
            markerUnits: 'userSpaceOnUse',
            markerWidth: 12,
            markerHeight: 12,
            viewBox: '0 0 10 10',
            refX: 6,
            refY: 6,
            orient: 'auto'
        });

        let arrowPath = arrowMarker.append('path')
            .attr('d', 'M2,2 L10,6 L2,10 L6,6 L2,2')
            .attr('fill', '#ccc');

        arrowMarker.path = arrowPath;
        return arrowMarker;
    }

    /**
     * 其余节点箭头均指向(会聚) index 节点，用于查看从其他节点流入该节点的转移信息
     *
     * @param  {number} index 汇聚的节点索引
     */
    to(index) {
        let {colors} = this.options;
        let circles = this.circles.nodes();

        this.lines.forEach(item => {

            // 找到到达 index 节点的线条
            if (item.j === index) {
                item.line.style('display', 'block');
                item.line.label.attr('opacity', 1).attr('fill', colors[index]);
                item.line.attr('stroke', colors[index]);
                d3Select(circles[index]).attr('stroke', '#fe0').attr('stroke-width', 3);
                this.arrowMarker.path.attr('fill', colors[index]);
            }
            else {
                item.line.style('display', 'none');
                item.line.label.attr('opacity', 0);
                d3Select(circles[item.j]).attr('stroke', 'none');
            }
        });
    }

    /**
     * 从 index 节点发出箭头到其他所有节点，用于查看从该节点流出到其他节点的转移信息
     *
     * @param  {number} index 发散的节点索引
     */
    from(index) {
        let {colors} = this.options;
        let circles = this.circles.nodes();
        this.lines.forEach(item => {
            if (item.i !== index) {
                item.line.style('display', 'none');
                item.line.label.attr('opacity', 0);
                d3Select(circles[item.i]).attr('stroke', 'none');
            }
            else {
                item.line.style('display', 'block');
                item.line.label.attr('opacity', 1).attr('fill', colors[index]);
                this.arrowMarker.path.attr('fill', colors[index]);
                d3Select(circles[index]).attr('stroke', '#fe0').attr('stroke-width', 3);
                item.line.attr('stroke', colors[index]);
            }
        });
    }

    /**
     * 创建节点、节点标签
     *
     * @return {Array} 分别返回节点、节点坐标参数(x,y,r)、节点标签
     */
    createCircles() {
        let {data, width, height, R_MAX, R_MIN, colors} = this.options;
        let {share, label} = data;

        let angleSpan = 2 * Math.PI / share.length;
        let padding = 20;
        let r = Math.min(width / 2, height / 2) - R_MAX - padding;
        let min = Math.min(...share);
        let max = Math.max(...share);
        let sum = share.reduce((a, b) => a + b, 0);

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
            .text((d, i) => {
                return d + ' : ' + (share[i] / sum * 100).toFixed(2) + '%'
            })
            .style('fill', (d, i) => colors[i])
            .style('font-size', '12px')
            .style('text-anchor', 'middle');

        return [circles, points, texts];
    }

    /**
     * 点击节点，根据参数 mode 进行发散或者汇聚
     *
     * @param  {Object} data 节点参数
     * @param  {number} i    节点索引
     */
    onCircleClick(data, i) {
        this[this.options.mode](i);
    }

    /**
     * 创建节点之间的连线
     *
     * @return {Array} 节点连线信息，每个元素包括(i-开始节点, j-结束节点, line-节点连线)
     */
    createLines() {
        let points = this.points;
        let g = this.svgGroup;
        let lines = [];
        let {data, LINE_WIDTH_MIN, LINE_WIDTH_MAX} = this.options;
        let {ratio, label} = data;
        let tooltip = this.tooltip;
        let me = this;

        let max = Math.max(...ratio.map(item => Math.max(...item)));
        let min = Math.min(...ratio.map(item => Math.min(...item)));

        points.forEach((item, i) => {
            points.forEach((nextItem, j) => {

                if (i !== j) {

                    // 计算直线和圆相交点的坐标
                    let theta = Math.atan((nextItem.y - item.y) / (nextItem.x - item.x));
                    let x2 = nextItem.x + (nextItem.r + 5) * Math.cos(theta);
                    let y2 = nextItem.y + (nextItem.r + 5) * Math.sin(theta);

                    if (nextItem.x > item.x) {
                        x2 = nextItem.x - (nextItem.r + 5) * Math.cos(theta);
                        y2 = nextItem.y - (nextItem.r + 5) * Math.sin(theta);
                    }

                    // 计算宽度
                    let lineWidth = LINE_WIDTH_MIN
                        + Math.floor(Util.normalize(ratio[i][j], min, max) * (LINE_WIDTH_MAX - LINE_WIDTH_MIN));

                    let line = g.append('line')
                        .attr('x1', item.x)
                        .attr('y1', item.y)
                        .attr('x2', x2)
                        .attr('y2', y2)
                        .attr('stroke', '#ccc')
                        .attr('stroke-width', lineWidth)
                        .attr('marker-end', 'url("#arrow")');

                    // 这里没有用 line.on('mouseover') ，因为取不到 d3.event，很奇怪
                    let node = line.node();
                    node.addEventListener('mouseover', function (e) {
                        clearTimeout(me.timer);
                        let {pageX, pageY} = e || window.event || {};
                        if (pageX && pageY) {
                            let sum = ratio[i].reduce((a, b) => a + b, 0);
                            let txt = label[i] + ' -> ' + label[j] + ' : '
                                + (ratio[i][j] / sum * 100).toFixed(2) + '%';
                            tooltip
                                .style('left', pageX + 'px')
                                .style('top', pageY + 'px')
                                .style('display', 'block')
                                .text(txt);
                        }
                    });

                    node.addEventListener('mouseout', function () {
                        me.timer = setTimeout(() => {
                            tooltip.style('display', 'none');
                        }, 2000);
                    });

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
     * 销毁，主要是提示框
     */
    dispose() {
        if (this.tooltip) {
            let node = this.tooltip.node();
            node.parentNode.removeChild(node);

            delete this.tooltip;
        }
    }
}

export function start() {
    document.querySelector('#main').innerHTML = '';

    new Transfer({
        el: '#main'
    });
}
