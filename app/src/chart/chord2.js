/**
 * @file 余弦图
 * @author zengxiaohui(zengxiaohui@baidu.com)
 */

import './chord.less';

import Chart from './chart';
import * as d3 from 'd3';

class Chord extends Chart {

    constructor(options) {
        super(options);

        // 初始化一些参数
        this.initOption();

        // 开始渲染
        this.render();
    }

    /**
     * 根据参数，创建一些全局变量
     */
    initOption() {
        let {legend} = this.options;
        let legendData = legend.data;

        // 标签选中数组，选中为1，未选中为0，默认全部选中, [1, 1, 1, 1, ...]
        this.selectedLabelArray = legendData.map(() => 1);

        // svg元素
        this.svg = this.createSVG();

        // 创建一个g元素，移动至画面中心，后续元素都会在这里边绘制
        this.rootGroup = this.createRootGroup();

        // 颜色比例尺
        this.colorScale = this.createColorScale(this.selectedLabelArray);

        // 图例标签比例尺
        this.legendScale = this.createLegendScale(this.selectedLabelArray);
    }

    /**
     * 创建 SVG 标签
     *
     * 1. 如果 option 中包含 el 元素，则挂在 el 元素下边，否则挂在 body 元素下
     * 2. 指定 svg 的宽度和高度
     * 3. 指定 svg 样式为 'd3-svg'
     *
     * @return {Object} d3 生成的 svg 元素
     */
    createSVG() {
        let {width, height, el = 'body'} = this.options;

        let svg = d3.select(el).append('svg')
            .attr('class', 'd3-svg')
            .attr('width', width)
            .attr('height', height);

        return svg;
    }

    /**
     * 创建主绘图区域，不包括 legend 区域
     *
     * 1. 由于和弦图属于一个圆形布局，因此需要将原点移动到画面中心
     * 2. 指定 g 的样式为 'd3-root-group'
     *
     * @return {Object} d3 生成的 g 元素
     */
    createRootGroup() {
        let svg = this.svg;
        let {width, height} = this.options;

        // 如果 legend 组件在上部区域，需要腾出一定空间来给 legend 组件
        let paddingTop = 15;
        let left = width / 2;
        let top = height / 2 + paddingTop;

        let g = svg
            .append('g')
            .attr('class', 'd3-root-group')
            .attr('transform', `translate(${left} , ${top})`);

        return g;
    }

    /**
     * 创建颜色比例尺
     *
     * 1. 需要注意，颜色比例尺依赖于 legend 组件的点击事件，需要根据 legend 组件的选中情况动态更新
     *
     * @param {Array.<number>} selectedLabelArray 标签选中数组
     * @return {Object} 颜色序数比例尺
     */
    createColorScale(selectedLabelArray) {
        let color = this.options.color;
        let selectedColor = color.filter((item, i) => selectedLabelArray[i]);

        return d3
            .scaleOrdinal()
            .domain(d3.range(selectedColor.length))
            .range(selectedColor);
    }

    /**
     * 创建标签比例尺
     *
     * 1. 标签比例尺也依赖于 legend 选中数组(legend点击事件，初始化参数等会影响该数组)
     *
     * @param {Array.<number>} selectedLabelArray 标签选中数组
     * @return {Object} 标签序数比例尺
     */
    createLegendScale(selectedLabelArray) {
        let legendData = this.options.legend.data;
        let selectedLegendData = legendData.filter((item, i) => selectedLabelArray[i]);
        let labels = selectedLegendData.map(item => item.name);

        return d3
            .scaleOrdinal()
            .domain(d3.range(labels.length))
            .range(labels);
    }

    /**
     * 设置参数，刷新 legend 和主图形
     *
     * @override
     */
    setOption(options) {

        // 如果SVG标签已经存在，先清空内容
        if (this.svg) {
            this.svg.html('');
        }

        this.options = options;
        this.render();
    }

    /**
     * 渲染函数，分别渲染 legend 和主图形
     */
    render() {

        this.renderLegend();
        this.renderChord();
    }

    /**
     * 渲染 legend
     */
    renderLegend() {
        let me = this;
        let legendOptions = this.options.legend;
        let colorScale = this.colorScale;
        let isVertical = legendOptions.orient === 'vertical';

        // legend 直接添加到 svg 下边而不是 rootGroup 下
        let legendGroup = this.svg
            .append('g')
            .attr('class', 'd3-legend-group');

        // 绘制每一个 items
        let legendData = legendOptions.data;
        let labels = legendData.map(item => item.name);

        // 每一个 legend item 为一个 group，包括 symbol 和 text
        let legendItemWidth = legendOptions.itemWidth;
        let legendItems = legendGroup.selectAll('g')
            .data(labels)
            .enter()
            .append('g')
            .attr('class', 'd3-legend-item')
            .attr('transform', (d, i) => {

                // 每个 legend item 宽度为 legendItemWidth
                // 这里需要手动调整参数，就不计算最长的一个 legendItem 了
                return isVertical
                    ? `translate(0, ${i * 30})`
                    : `translate(${i * legendItemWidth}, 0)`;
            })
            .on('click', function (d, i) {

                let rect = d3.select(this.querySelector('rect'));
                let text = d3.select(this.querySelector('text'));

                // 设置 disabled 状态
                this.disabled = !this.disabled;

                // 更新选中的标签数组
                me.selectedLabelArray[i] = +(!this.disabled);

                // 如果未选中，颜色置灰
                if (this.disabled) {
                    rect.attr('fill', '#ccc');
                    text.attr('stroke', '#ccc');
                }
                else {
                    rect.attr('fill', colorScale(i));
                    text.attr('stroke', 'inherit');
                }

                // 根据选中的标签，重新计算矩阵等数据
                me.computeMatrix(me.selectedLabelArray);
            });

        // 添加形状
        // TODO 这里默认是 rect，后续根据 icon 参数生成其他图形
        legendItems.append('rect')
            .attr('width', legendOptions.iconWidth || 14)
            .attr('height', legendOptions.iconHeight || 14)
            .attr('fill', (d, i) => colorScale(i));

        // 添加文字
        // TODO 这里当左侧的形状大小变更时，如何设置 dx 和 dy 保证垂直居中以及左侧不重叠?
        legendItems
            .append('text')
            .attr('dx', '19')
            .attr('dy', '11')
            .text(d => d);

        // legend 定位
        me.positionLegend(legendGroup);
    }

    /**
     * Legend 内容生成好以后，需要根据参数进行定位，例如水平还是垂直放置，放置坐标等等
     *
     * @param  {Object} legendGroup legend 根元素
     */
    positionLegend(legendGroup) {
        let bounds = legendGroup.node().getBoundingClientRect();
        let legendOptions = this.options.legend;
        let {width} = this.options;
        let defaultPadding = 10;

        // 定位，后续需要提取函数
        if (!legendOptions.left || legendOptions.left === 'left' || legendOptions.left === 'auto') {
            legendGroup.attr('transform', `translate(${defaultPadding}, ${defaultPadding})`);
        }
        else if (legendOptions.left === 'center' || legendOptions.left === 'middle') {
            legendGroup.attr('transform', `translate(${(width - bounds.width) / 2}, 10)`);
        }
        else if (legendOptions.left === 'right') {
            legendGroup.attr('transform', `translate(${width - bounds.width - defaultPadding}, ${defaultPadding})`);
        }
        else {

        }
    }

    computeMatrix(labelArray) {
        let serieData = this.options.series[0].data;

        let rows = [];
        serieData.forEach((item, i) => {
            if (labelArray[i]) {
                rows.push(item);
            }
        });

        let result = [];

        rows.forEach((item, i) => {
            let newRow = [];
            item.forEach((innerItem, j) => {
                if (labelArray[j]) {
                    newRow.push(innerItem);
                }
            });
            result.push(newRow);
        });

        // 重新计算图例标签比例尺
        this.legendScale = this.createLegendScale(labelArray);

        // 颜色比例尺
        this.colorScale = this.createColorScale(labelArray);

        this.renderChord(result);

        return result;
    }

    renderChord(matrix) {
        let rootGroup = this.rootGroup;
        rootGroup.html('');
        if (this.tooltip) {
            this.tooltip.node().parentNode.removeChild(this.tooltip.node());
        }

        let {width, height, series} = this.options;
        let ringWidth = this.options.series[0].ringWidth;
        let padding = 30;

        let outerRadius = Math.min(width, height) / 2 - padding;
        let innerRadius = outerRadius - ringWidth;

        let serieData = series[0];

        // 创建和弦图布局
        let chord = d3.chord()

            // 外层节点之间的角度间隔，这里是 6℃
            .padAngle(serieData.padAngle)

            // 某个节点流出线条大小排序，这里降序排列
            .sortSubgroups(d3.descending);

        rootGroup.datum(chord(matrix || serieData.data));

        // 创建曲线
        let arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        // 创建外层数据节点
        let groups = rootGroup.append('g')
            .attr('class', 'groups')
            .selectAll('g')
            .data(chords => {
                return chords.groups;
            })
            .enter()
            .append('g')
            .on('mouseover', function (d, i) {
                me.mouseover.call(me, d, i, this);
            })
            .on('mousemove', function (d, i) {
                me.mousemove.call(me, d, i, this);
            })
            .on('mouseout', function (d, i) {
                me.mouseout.call(me, d, i, this);
            });

        // 实际创建
        groups.append('path')
            .style('fill', d => this.colorScale(d.index))
            .style('stroke', d => d3.rgb(this.colorScale(d.index)).darker())
            .attr('d', arc);

        // 创建丝带
        let ribbon = d3.ribbon().radius(innerRadius);

        let me = this;
        rootGroup.append('g')
            .attr('class', 'ribbons')
            .selectAll('path')
            .data(chords => chords)
            .enter()
            .append('path')
            .attr('d', ribbon)
            .style('fill', d => this.colorScale(d.target.index))
            .style('stroke', d => d3.rgb(this.colorScale(d.target.index)).darker())
            .on('mouseover', function (d, i) {
                me.ribbonMouseover.call(me, d, i, this);
            })
            .on('mousemove', function (d, i) {
                me.ribbonMousemove.call(me, d, i, this);
            })
            .on('mouseout', function (d, i) {
                me.ribbonMouseout.call(me, d, i, this);
            });

        let tooltip = d3.select('body').append('div')
            .attr('class', 'd3-tooltip');

        this.tooltip = tooltip;
        this.legend = this.legendScale;
    }

    appendTo(dom) {
        dom.innerHTML = '';

        // 关系矩阵
        let matrix = [
            [11975, 5871, 8916, 2868],
            [1951, 10048, 2060, 6171],
            [8010, 16145, 8090, 8045],
            [1013, 990, 940, 6907]
        ];

        // 定义画布宽高
        let width = 500;
        let height = 500;

        // 定义画布填充
        let margin = {
            top: 20,
            left: 20,
            right: 20,
            bottom: 20
        };

        // 实际绘图区域
        let innerWidth = width - margin.left - margin.right;
        let innerHeight = height - margin.top - margin.bottom;

        // 环宽
        let ringWidth = 30;

        // 外圈半径
        let outerRadius = Math.min(innerWidth, innerHeight) / 2 - 30;

        // 内圈半径
        let innerRadius = outerRadius - ringWidth;

        // 创建 svg
        let svg = d3.select(dom).append('svg')
            .attr('width', width)
            .attr('height', height);

        // 创建和弦图布局
        let chord = d3.chord()

            // 外层节点之间的角度间隔，这里是 6℃
            .padAngle(3 * Math.PI / 180)

            // 某个节点流出线条大小排序，这里降序排列
            .sortSubgroups(d3.descending);

        // 创建曲线
        let arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        // 创建丝带
        let ribbon = d3.ribbon().radius(innerRadius);

        // 创建颜色比例尺
        let color = d3.scaleOrdinal()
            .domain(d3.range(4))
            .range(['#000000', '#FFDD89', '#957244', '#F26223']);

        let legendData = ['宝马', '特斯拉', '奔驰', '凯迪拉克'];

        // 创建标签数组
        let legend = d3.scaleOrdinal()
            .domain(d3.range(4))
            .range(legendData);

        // 移动至中心
        let g = svg.append('g')
            .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
            .datum(chord(matrix));

        let me = this;
        // 创建外层数据节点
        let group = g.append('g')
            .attr('class', 'groups')
            .selectAll('g')
            .data(chords => {
                return chords.groups;
            })
            .enter()
            .append('g')
            .on('mouseover', function (d, i) {
                me.mouseover.call(me, d, i, this);
            })
            .on('mousemove', function (d, i) {
                me.mousemove.call(me, d, i, this);
            })
            .on('mouseout', function (d, i) {
                me.mouseout.call(me, d, i, this);
            });

        // 实际创建
        group.append('path')
            .style('fill', d => color(d.index))
            .style('stroke', d => d3.rgb(color(d.index)).darker())
            .attr('d', arc);

        // 创建内部的丝带
        g.append('g')
            .attr('class', 'ribbons')
            .selectAll('path')
            .data(chords => chords)
            .enter()
            .append('path')
            .attr('d', ribbon)
            .style('fill', d => color(d.target.index))
            .style('stroke', d => d3.rgb(color(d.target.index)).darker())
            .on('mouseover', function (d, i) {
                me.ribbonMouseover.call(me, d, i, this);
            })
            .on('mousemove', function (d, i) {
                me.ribbonMousemove.call(me, d, i, this);
            })
            .on('mouseout', function (d, i) {
                me.ribbonMouseout.call(me, d, i, this);
            });

        let tooltip = d3.select('body').append('div')
            .attr('class', 'd3-tooltip');

        let legendGroups = g.append('g')
            .attr('transform', 'translate(' + (-innerWidth/2) + ',' + (-innerHeight/2) +')')
            .selectAll('g')
            .data(legendData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => {
                return `translate(${i * 80}, 0)`;
            })
            .on('click', function (d, i) {
                let rect = this.querySelector('rect');
                let text = this.querySelector('text');

                this.disabled = !this.disabled;

                if (this.disabled ) {
                    d3.select(rect).attr('fill', '#ccc');
                    d3.select(text).attr('stroke', '#ccc');
                }
                else {
                    d3.select(rect).attr('fill', color(i));
                    d3.select(text).attr('stroke', 'inherit');
                }
            });

        legendGroups
            .append('rect')
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', (d, i) => color(i));

        legendGroups
            .append('text')
            .attr('dx', 25)
            .attr('dy', 15)
            .text((d, i) => {
                return d;
            });
            // .on('mouseover', function (d, i) {
            //     d3.select(this).attr('stroke', d3.rgb(color(i)).brighter());
            //     d3.select(this).attr('strokeWidth', '1');
            // })
            // .on('mouseout', function (d, i) {
            //     // d3.select(this).attr('stroke', '#333');
            //     // d3.select(this).attr('strokeWidth', '1');
            // });

        this.tooltip = tooltip;
        this.legend = legend;
    }



    ribbonMouseover(e, i, dom) {

        let tooltip = this.tooltip;
        let legend = this.legend;
        tooltip.html(`${legend(e.source.index)}:${e.source.value} => ${legend(e.target.index)}:${e.target.value}`);

        d3.select(dom).style('opacity', .5);
        return tooltip.transition().duration(50).style('opacity', 0.9);
    }

    ribbonMousemove(e, i, dom) {
        let tooltip = this.tooltip;
        return tooltip
            .style('top', (d3.event.pageY - 10) + 'px')
            .style('left', (d3.event.pageX + 10) + 'px');
    }

    ribbonMouseout(e, i, dom) {
        let tooltip = this.tooltip;

        d3.select(dom).style('opacity', 1);
        return tooltip.style('opacity', 0);
    }

    mouseover(e, i, dom) {

        let [x, y] = d3.mouse(dom);

        let tooltip = this.tooltip;
        let legend = this.legend;

        tooltip.html(legend(i) + ' : ' + e.value);
        return tooltip.transition().duration(50).style('opacity', 0.9);
    }

    mousemove(e, i, dom) {
        let tooltip = this.tooltip;
        return tooltip
            .style('top', (d3.event.pageY - 10) + 'px')
            .style('left', (d3.event.pageX + 10) + 'px');
    }

    mouseout(e, i, dom) {
        let tooltip = this.tooltip;
        return tooltip.style('opacity', 0);
    }

    dispose() {
        if (this.tooltip) {
            let tooltipNode = this.tooltip.node();
            tooltipNode.parentNode.removeChild(tooltipNode);
        }
    }
}

export function start() {

    let chord = new Chord({

        el: '#main',

        // 图形宽和高
        width: 500,
        height: 500,

        // 标题
        title: {
            show: true,
            text: '和弦图',
            left: 'auto',
            top: 'auto',
            right: 'auto',
            bottom: 'auto',
            backgroundColor: 'transparent',
            textStyle: {
                color: '#333'
            }
        },

        // 图例
        legend: {
            show: true,
            left: 'auto',
            top: 'auto',
            right: 'auto',
            bottom: 'auto',
            orient: 'vertical',
            itemGap: 10,
            itemWidth: 60,
            iconWidth: 14,
            iconHeight: 14,
            // data: [
            //     {name: '宝马', icon: 'rect', textStyle: {}},
            //     {name: '特斯拉', icon: 'rect', textStyle: {}},
            //     {name: '奔驰', icon: 'rect', textStyle: {}},
            //     {name: '凯迪拉克', icon: 'rect', textStyle: {}}
            // ],

            data: [
                {name: '仁和', icon: 'rect', textStyle: {}},
                {name: '仲景', icon: 'rect', textStyle: {}},
                {name: '同仁堂', icon: 'rect', textStyle: {}},
                {name: '九芝堂', icon: 'rect', textStyle: {}},
                {name: '汇仁', icon: 'rect', textStyle: {}}
            ],
            textStyle: {},
            tooltip: {}
        },



        series: [
            {
                type: 'chord',

                // 和弦图关系矩阵
                // data: [
                //     [11975, 5871, 8916, 2868],
                //     [1951, 10048, 2060, 6171],
                //     [8010, 16145, 8090, 8045],
                //     [1013, 990, 940, 6907]
                // ],

                data: [[0,0.0612,0.102,0.2857,0.551],[0.0352,0,0.2962,0.3666,0.3021],[0.0121,0.0675,0,0.7036,0.2168],[0.01,0.0378,0.3681,0,0.5841],[0.0264,0.0603,0.1324,0.7809,0]],

                // 环宽
                ringWidth: 30,

                // 间隔角度
                padAngle: 3 * Math.PI / 180,

                // 组 tooltip 设置和格式化函数
                groupTooltip: {
                    show: true
                },

                // 丝带 tooltip 设置和格式化函数
                ribbonTooltip: {
                    show: true
                }
            }
        ],

        // 调色板
        // color: ['#000000', '#FFDD89', '#957244', '#F26223'],
        color: ['#d99', '#FFDD89', '#957244', '#F26223', '#abc'],

        // 画板背景颜色
        backgroundColor: 'transparent'
    });
}
