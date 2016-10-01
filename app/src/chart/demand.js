/**
 * @file 需求图谱
 * @author zengxiaohui(zengxiaohui@baidu.com), qianjing<qianjing02@baidu.com>
 */
import './demand.less';

import _ from 'lodash';
import * as d3 from 'd3';
import Util from '../common/util';
import Chart from './chart';
import demandData from './demandData';
import dragImagePng from '../static/img/zoomhander.png';

/**
 * 默认参数
 *
 * @type {Object}
 */
const defaultOptions = {

    // 默认挂载元素, 例如 '#main'
    el: 'body',

    // 图形宽和高
    width: 990,
    height: 530,

    // 节点最小半径和最大半径
    R_MIN: 10,
    R_MAX: 30,

    // 是否需要打乱节点
    random: true,

    /**
     * 节点分组设置，所有节点根据相关性分为了四组，下边为每一组值的配置：
     *
     * {
     *     // 0-半径，与相关性成反比
     *     radius: 100,
     *
     *     // 1-最大半径偏移，最终的半径为 radius + radiusOffset
     *     maxRadiusOffset: 30,
     *
     *     // 2-1/4角度
     *     angle: 10,
     *
     *     // 3-最少4个相关词
     *     minWordLength: 4,
     *
     *     // 4-最多8个相关词
     *     maxWordLength: 8
     * }
     *
     * @type {Array}
     */
    group: [
        [100, 30, 80, 4, 8],
        [200, 30, 50, 4, 8],
        [300, 30, 30, 4, 10],
        [400, 30, 23, 4, 12]
    ],

    /**
     * 相关词数据，格式为
     *
     * {
     *     "name": "助手",
     *     "query": 4975,
     *     "r": 1055, // 相关度
     *     "up": 1,   // up为1表示增长，-1表示下降
     *     "region": "region1" // 字段没用上
     * }
     *
     * @type {Array}
     */
    data: [],

    // 中心词
    center: '手机',

    // 上升趋势颜色
    upColor: '#fa7c62',

    // 下降趋势颜色
    downColor: '#20b78e',

    // 节点边框颜色
    strokeColor: '#fff',

    // 时间进度条开始日期
    startDate: new Date(2015, 9, 4),

    // 时间进度条结束日期
    endDate: new Date(2016, 8, 25)
};

/**
 * 需求图谱
 *
 * @class 需求图谱
 * @extends Chart
 */
class Demand extends Chart {

    /**
     * 构造函数
     *
     * @param  {Object} options 参数
     */
    constructor(options) {
        super();

        this.options = _.extend({}, defaultOptions, options);
        this.init();
    }

    /**
     * 初始化
     */
    init() {

        // 创建图片背景，只绘制一次
        this.wrapper = this.createBackground();

        // 创建SVG
        [this.svg, this.svgGroup] = this.createSVG();

        // 创建中心词
        this.renderCenterWord();

        // 创建进度条
        // this.createDateBar();

        this.timeline = this.createTimeline();

        // 分词
        this.participle();

        // 刷新
        if (this.load) {
            this.refreshLoad();
        }
        // 第一次载入
        else {
            // 创建节点列表
            this.createPoints();

            this.firstLoad();

            // this.start();

            // 运行节点
            this.load = true;
        }
    }

    createTimeline() {

        let {startDate, endDate, width, height} = this.options;
        let weeks = Util.getRangeWeeks(startDate, endDate).reverse();
        let weekData = _.map(weeks, (item, i) => {
            return {
                index: i,
                start: Util.formatDate(item.start),
                end: Util.formatDate(item.end)
            };
        });

        return new Timeline({
            svg: this.svg,
            svgWidth: width,
            svgHeight: height,
            startDate,
            endDate,
            weekData,
            auto: true // 是否自动播放
        });
    }

    createDateBar() {
        let me = this;
        let {startDate, endDate, el} = this.options;
        let weeks = Util.getRangeWeeks(startDate, endDate);
        let weekLabels = _.map(weeks, item => {
            return Util.formatDate(item.start) + '-' + Util.formatDate(item.end);
        }).reverse();

        let monthLabels = [];
        let oldLabel = '';
        _.each(weeks, item => {
            let month = item.end.getMonth() + 1;
            let label = month + '月';

            // 如果是1月，需要加上年份区分
            if (month === 1) {
                label = item.end.getFullYear() + '年' + month + '月';
            }

            if (label !== oldLabel) {
                monthLabels.unshift(label);
            }

            oldLabel = label;
        });

        // console.log(weekLabels);
        // console.log(monthLabels);
        let g = this.svg.append('g').style('opacity', 0);
        let weekPositions = [];
        let rects = g.selectAll('rect.date-bar-item')
            .data(weekLabels)
            .enter()
            .append('rect')
            .attr('class', 'date-bar-item')
            .attr('width', 14)
            .attr('height', 10)
            .attr('x', (d, i) => {
                let x = 15.5 * i;
                !weekPositions[d] && (weekPositions[d] = {});
                weekPositions[d].x = x;
                weekPositions[d].i = i;
                weekPositions[d].name = d;
                return x;
            })
            .attr('y', (d, i) => {
                let y = 0;
                !weekPositions[d] && (weekPositions[d] = {});
                weekPositions[d].y = y;
                return y;
            })
            .attr('fill', '#c3dafb')
            .attr('storke', 'none');

        rects.on('click', function (e, i) {
            me.jump(i);
        });

        let weekValues = _.values(weekPositions);
        this.weekValues = weekValues;

        let {width, height, left: gLeft, right: gRight, top: gTop} = g.node().getBoundingClientRect();
        let {width: svgWidth, height: svgHeight} = this.options;
        let left = (svgWidth - width) / 2;
        let top = svgHeight - 55;
        g.transition().duration(500).attr('transform', `translate(${left}, ${top})`).style('opacity', 1);

        let texts = g.selectAll('text.month-label')
            .data(monthLabels)
            .enter()
            .append('text')
            .attr('class', 'month-label')
            .attr('x', (d, i) => {
                return 50 + 4 * 17 * i;
            })
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .attr('fill', '#9a9a9a')
            .text(d => d);

        // console.log(dragImagePng);
        let dragImage = g
            .append('image')
            .attr('width', 12)
            .attr('height', 23)
            .attr('preserveAspectRatio', 'none')
            .attr('xlink:href', dragImagePng)
            .attr('x', 0)
            .attr('y', -15)
            .style('-webkit-tap-highlight-color', 'rgba(0, 0, 0 ,0)')
            .style('cursor', 'move');

        let toolTip = g.select('div.demand-tool-tip')
            .data([1])
            .enter()
            .append('div')
            .attr('class', 'demand-tool-tip');

        toolTip.top = gTop + top - 50;
        toolTip.initLeft = gLeft;

        dragImage.call(
            d3
                .drag()
                .on('start', e => {
                    console.log('dragging', d3.event);


                    if (me.interval) {
                        clearInterval(me.interval);
                    }

                    let x = d3.event.x;
                    if (x > gRight) {
                        x = gRight - 22;
                        dragImage.attr('x', x);
                    }

                    if (x < gLeft) {
                        x = gLeft - 8;
                        dragImage.attr('x', x);
                    }

                })
                .on('drag', e => {
                    let x = d3.event.x;
                    let sourceEvent = d3.event.sourceEvent;

                    let minValue = _.minBy(weekValues, item => Math.abs(x - item.x));

                    if (x > gRight) {
                        x = gRight - 22;
                    }

                    if (x < gLeft) {
                        x = gLeft - 8;
                    }

                    dragImage.attr('x', x);
                    toolTip
                        .text(minValue.name)
                        .style('left', (sourceEvent.clientX - 60) + 'px')
                        .style('top',  toolTip.top + 'px')
                        .style('opacity', 1);
                })
                .on('end', e => {
                    let x = d3.event.x;

                    let weekValues = _.values(weekPositions);
                    let minValue = _.minBy(weekValues, item => Math.abs(x - item.x));

                    dragImage.attr('x', minValue.x);

                    console.log(`当前选择的周是：${minValue.name}`);

                    toolTip.style('opacity', 0);
                })
        );

        this.dragImage = dragImage;
        this.toolTip = toolTip;
    }

    /**
     * 显示下一个节点数据
     */
    next() {

    }

    /**
     * 显示上一个节点数据
     */
    prev() {

    }

    /**
     * 跳转到某个节点，显示某个节点数据
     */
    jump(i) {
        if (this.interval) {
            clearInterval(this.interval);
            this.toolTip.style('opacity', 0);
        }

        let point = this.weekValues[i];
        this.dragImage.transition().duration(500).attr('x', point.x);
        this.currentIndex = i;
    }

    /**
     * 开始轮播
     * @return {[type]} [description]
     */
    start(i = 0) {
        let weekValues = this.weekValues;

        // 运动节点
        let currPoint = weekValues[i];
        let {x:x1, y:y1, name:name1} = currPoint;

        let nextPoint;
        // while (nextPoint = weekValues[i+1]) {
        //     let {x2, n2, name2} = nextPoint;
        // }
        let me = this;

        // let {left, top, width, height} = me.dragImage.node().getBoundingClientRect();
        // me.toolTip.style('top', top + 50 + 'px');

        this.interval = setInterval(function () {
            nextPoint = weekValues[++i];

            if (!nextPoint) {
                i = 0;
                nextPoint = weekValues[i]
            }

            let {x:x2, n:n2, name:name2} = nextPoint;
            me.dragImage.transition().duration(500).attr('x', x2);
            let initLeft = me.toolTip.initLeft;
            me.toolTip.transition().duration(500)
                .text(name2)
                .style('left', (initLeft + x2 + 30) + 'px')
                .style('top', me.toolTip.top + 'px')
                .style('opacity', 1);

        }, 2000);

        // 显示提示

        // 拉取数据渲染

        // 跳转到下一帧
    }

    /**
     * 暂停
     * @return {[type]} [description]
     */
    pause() {

    }

    /**
     * 停止播放
     * @return {[type]} [description]
     */
    stop() {

    }

    createPoints() {
        let points = this.getPoints();
        let elements = [];

        _.each(points, point => {
            let g = this.svgGroup.append('g');
            let circle = Util.circle(g, point.x, point.y, point.cr).attr('fill', point.fillColor).attr('stroke', point.strokeColor);
            let text = Util.text(g, point.x, point.y + point.cr + 15, point.name).attr('text-anchor', 'middle').attr('font-size', 12);

            elements.push({
                x: point.x,
                y: point.y,
                cr: point.cr,
                fillColor: point.fillColor,
                root: g,
                circle,
                text,
                name: point.name,
                groupIndex: point.groupIndex
            });
        });

        this.elements = elements;
    }

    getPoints() {
        let {R_MIN, R_MAX, group, downColor, upColor, strokeColor} = this.options;
        let points = [];
        let [min, max] = d3.extent(this.options.data, item => item.query);

        _.each(this.words, (wordgroup, i) => {
            let groupItem = group[i];
            let groupLen = wordgroup.length;

            let angle = groupItem[2];
            let angleSpan = 2 * angle / groupLen;
            if (angleSpan < 10) {
                angleSpan = 10;
            }
            let angles = d3
                .range(-angle - 5, angle, angleSpan)
                .concat(d3.range(180 - angle, 180 + angle + 5, angleSpan));
            angles = angles.map(item => (item + 360) % 360);
            angles = _.shuffle(_.uniq(angles));

            _.each(wordgroup, (word, j) => {
                let xangle = angles.pop();
                if (!_.isUndefined(xangle)) {
                    let r = groupItem[0] + _.random(0, groupItem[1]);

                    let x = r * Math.cos(xangle * Math.PI / 180);
                    let y = r * Math.sin(xangle * Math.PI / 180) - 20;
                    let cr = R_MIN + Util.normalize(word.query, min, max, R_MAX - R_MIN);

                    let fillColor = downColor;
                    if (word.up === 1) {
                        fillColor = upColor;
                    }
                    let name = word.name;
                    let groupIndex = i;

                    points.push({x, y, cr, fillColor, strokeColor, name, groupIndex});
                }
            });
        });

        return points;
    }

    // setOption(options) {
    //     this.wrapper && (this.wrapper.innerHTML = '');
    //     this.options = _.extend({}, defaultOptions, options);
    //     this.init();
    // }

    setData(data) {
        this.options.data = data;
        this.participle();
        this.refreshLoad();
    }

    firstLoad() {

    }

    refreshLoad() {
        let points = this.getPoints();
        let oldWords = _.map(this.elements, item => item.name);
        let oldWordsMap = {};
        _.each(oldWords, item => {
            oldWordsMap[item] = 1;
        });

        let newWords = _.map(this.options.data, item => item.name);

        let myMap = {
            same: [],
            diff: []
        };

        _.each(this.words, (wordGroup, i) => {
            _.each(wordGroup, (word, j) => {
                if (oldWordsMap[word.name]) {

                    let from = _.find(this.elements, item => item.name === word.name);
                    let groupPoints = _.filter(points, item => item.groupIndex === i && !item.selected);
                    let targetGroupPoint = _.find(points, item => item.name === word.name);


                    // let minPoint = groupPoints[0];
                    // _.each(groupPoints, (p, i) => {
                    //     let v = Math.sqrt(
                    //         (p.x - from.x) * (p.x - from.x) + (p.y - from.y) * (p.y - from.y)
                    //     );
                    // });

                    let minPoint = _.minBy(groupPoints, (p, i) => {
                        return Math.sqrt(
                            (p.x - from.x) * (p.x - from.x) + (p.y - from.y) * (p.y - from.y)
                        );
                    });

                    minPoint.selected = true;

                    let to = {
                        x: minPoint.x,
                        y: minPoint.y,
                        cr: targetGroupPoint.cr,
                        name: minPoint.name,
                        fillColor: minPoint.fillColor
                    };

                    myMap.same.push({
                        from: from,
                        to: to
                    });
                }
                else {
                    console.log('不存在', word.name);
                }
            });
        });

        console.log(myMap);

        _.each(myMap.same, item => {
            let from = item.from;
            let to = item.to;
            from.circle.transition().duration(750).attr('cx', to.x).attr('cy', to.y);
            from.text.transition().duration(750)
                .attr('x', to.x)
                .attr('y', to.y + to.cr + 15);

            // let text = Util.text(g, point.x, point.y + point.cr + 15, point.name).attr('text-anchor', 'middle').attr('font-size', 12);

        });
    }

    /**
     * 创建背景图片
     *
     * @return {Selection} 根元素
     */
    createBackground() {
        return d3.select(this.options.el).append('div').attr('class', 'chart-demand');
    }

    /**
     * 创建SVG容器以及移动坐标轴的g元素
     *
     * @return {Array.<Selection>} SVG容器以及移动坐标轴的g元素
     */
    createSVG() {
        let {width, height} = this.options;
        let svg = this.wrapper.append('svg').attr('width', width).attr('height', height).attr('class', 'd3-svg');

        // 这两个参数用来调整与背景图片的中心对齐
        let xOffset = -1;
        let yOffset = -9;
        let x0 = width / 2 + xOffset;
        let y0 = height / 2 + yOffset;

        // 移动原点坐标到中心点(x0, y0)
        let root = svg.append('g').attr('transform', `translate(${x0}, ${y0})`);

        // 返回 svg 和 root 元素
        return [svg, root];
    }

    /**
     * 绘制中心词
     */
    renderCenterWord() {
        let centerWord = this.options.center;
        Util.text(this.svgGroup, 0, 7, centerWord).attr('class', 'demand-center');
    }

    participle() {
        let {data: words, group} = this.options;

        // 找对相关度的最大和最小值
        let [minRalation, maxRelation] = d3.extent(words, item => item.r);
        _.each(words, item => {
            item.r = parseInt(Util.normalize(item.r, minRalation, maxRelation, 100), 10);
        });

        // 将所有的单词按照 group 配置和 归一化的相关度(r值) 分组
        let groupNum = group.length;
        let groupArr = [];
        let i = groupNum;
        while (i--) {
            groupArr.push([]);
        }

        // 按相关度值分到各个组
        let gval = 100 / groupNum;
        _.each(words, item => {
            let n = Math.round(item.r / gval);
            (n >= groupNum) && (n -= 1);

            if (groupArr[groupNum - 1 - n] !== undefined) {
                groupArr[groupNum - 1 - n].push(item);
            }
        });

        _.each(group, (item, i) => {

            // 该组词的最小个数
            let gmin = item[3];

            // 该组词的最大个数
            let gmax = item[4];

            let garr = groupArr[i];
            let glen = garr.length;

            // 数据超过限制 多余的数据追加到后一下数组
            if (glen > gmax) {
                groupArr[i] = garr.slice(0, gmax);
                if (groupArr[i + 1] !== undefined) {
                    groupArr[i + 1] = garr.slice(gmax).concat(groupArr[i + 1]);
                }
            }
            // 数据小于限制 从后面的数组中取数据
            else if (glen < gmin) {
                for (let gi = i + 1; gi < groupNum; gi++) {
                    if (groupArr[gi] !== undefined && groupArr[gi].length > 0) {
                        groupArr[i] = groupArr[i].concat(groupArr[gi]);

                        if (groupArr[i].length >= gmin) {
                            // 超过最小值 中断退出
                            groupArr[gi] = groupArr[i].slice(gmin);
                            groupArr[i] = groupArr[i].slice(0, gmin);
                            break;
                        }
                        else {
                            groupArr[gi] = [];
                        }
                    }
                }
            }
        });

        this.words = groupArr;
        return groupArr;
    }
}

/**
 * 进度时间轴
 */
class Timeline {

    constructor(options) {
        this.options = options;

        // 当前索引
        this.index = 0;
        this.init();
    }

    init() {
        this.svg = this.options.svg;

        // 创建根元素
        this.g = this.svg.append('g').style('opacity', 0);

        // 创建时间轴节点
        this.rects = this.createTimelinePoints();

        // 创建时间轴标签
        this.labels = this.createTimelineLabels();

        this.centerTimeline();
    }

    centerTimeline() {
        let {svgHeight, svgWidth} = this.options;
        let {width, height, left, top} = this.g.node().getBoundingClientRect();
        let marginBottom = 55;

        let x = (svgWidth - width) / 2;
        let y = svgHeight - marginBottom;
        this.g.transition().duration(500)
            .attr('transform', `translate(${x}, ${y})`)
            .style('opacity', 1);

        // 记录坐标轴，避免重复计算
        this.g.left = left;
        this.g.top = top;
        this.g.height = height;
        this.g.width = width;
    }

    createTimelinePoints() {
        let weekData = this.options.weekData;

        // 时间点
        let [rectWidth, rectHeight, gap] = [14, 10, 1.5];
        let points = this.g.selectAll('rect.date-bar-item')
            .data(weekData)
            .enter()
            .append('rect')
            .attr('class', 'date-bar-item')
            .attr('width', rectWidth)
            .attr('height', rectHeight)
            .attr('x', (d, i) => {
                let x = (rectWidth + gap) * i;
                d.x = x;
                return x;
            })
            .attr('y', d => {
                let y = 0;
                d.y = 0;
                return y;
            })
            .attr('fill', '#c3dafb')
            .attr('storke', 'none');

        return points;
    }

    createTimelineLabels() {
        let labelTexts = this.formatTimelineLabels();
        let leftOffset = 48;
        let labels = this.g.selectAll('text.month-label')
            .data(labelTexts)
            .enter()
            .append('text')
            .attr('class', 'month-label')
            .attr('x', (d, i) => {
                return leftOffset + 4 * 17 * i;
            })
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .attr('fill', '#9a9a9a')
            .text(d => d);

        return labels;
    }

    formatTimelineLabels() {
        let weekData = this.options.weekData;
        let texts = [];

        let oldValue = '';
        _.each(weekData, item => {
            let [year, month] = item.end.split('.');
            let newValue = +month === 1 ? year + '年' + month + '月' : month + '月';

            if (newValue !== oldValue) {
                texts.push(newValue);
            }

            oldValue = newValue;
        });

        return texts;
    }

    start() {

    }

    go(index) {

    }

    next() {

    }

    prev() {

    }

    dispose() {

    }
}

export function start() {
    document.querySelector('#main').innerHTML = '';

    let formatData = _.values(demandData);
    let demand = new Demand({
        el: '#main',
        data: formatData[0]
    });

    let i = 0;
    // var timer = setInterval(
    //     function() {
    //         let data = formatData[++i];
    //         demand.setData(data);

    //         if (i >= 2) {
    //             i = 0;
    //         }
    //     },
    //     2000
    // );
}
