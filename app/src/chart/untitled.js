/*global d3*/

// 关系矩阵
let matrix = [
    [11975, 5871, 8916, 2868],
    [1951, 10048, 2060, 6171],
    [8010, 16145, 8090, 8045],
    [1013, 990, 940, 6907]
];

// 定义画布宽高
let width = 600;
let height = 600;

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
let outerRadius = Math.min(innerWidth, innerHeight) / 2;

// 内圈半径
let innerRadius = outerRadius - ringWidth;

// 数字格式化函数，千分位分隔，带后缀，这里是 k（1e3），因此 20132 格式化为 20K
let formatValue = d3.formatPrefix(',.0', 1e3);

// 创建 svg
let svg = d3.select('svg')
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

// 移动至中心
let g = svg.append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
    .datum(chord(matrix));

// 创建外层数据节点
let group = g.append('g')
    .attr('class', 'groups')
    .selectAll('g')
    .data(chords => {
        return chords.groups;
    })
    .enter()
    .append('g');

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
    .style('stroke', d => d3.rgb(color(d.target.index)).darker());

