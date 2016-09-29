/**
 * @file 全局函数
 * @author zengxiaohui(zengxiaohui@baidu.com)
 */

import * as d3 from 'd3';

export default class Util {

    /**
     * 创建带有宽高的 svg 元素，并挂载到 dom
     *
     * @param  {HTMLElement} dom      挂载元素
     * @param  {number}      width    宽度
     * @param  {number}      height   高度
     * @return {Object}               d3创建的SVG元素
     */
    static createSVG(dom, width, height) {
        return d3
            .select(dom)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
    }

    /**
     * 在节点 node 下添加文本节点
     *
     * @param  {Object} node    D3创建的Selection
     * @param  {number} x       x坐标
     * @param  {number} y       y坐标
     * @param  {string} content 内容
     * @return {Object}         D3创建的Selection
     */
    static text(node, x, y, content) {
        return node.append('text').attr('x', x).attr('y', y).text(content);
    }

    /**
     * 在节点 node 下添加圆形
     *
     * @param  {Object} node D3创建的Selection
     * @param  {number} cx   圆心x坐标
     * @param  {number} cy   圆心y坐标
     * @param  {number} r    半径
     * @return {Object}      D3创建的Selection
     */
    static circle(node, cx, cy, r) {
        return node.append('circle').attr('cx', cx).attr('cy', cy).attr('r', r);
    }

    /**
     * 归一化，如果有 multiplier（默认为1），则归一化的结果乘以 multiplier
     *
     * @param  {number} value      需要归一化的值
     * @param  {number} min        最小值
     * @param  {number} max        最大值
     * @param  {number} multiplier 乘数
     * @return {number}            归一化的值 * multiplier
     */
    static normalize(value, min, max, multiplier = 1) {
        return (value - min) * multiplier / (max - min);
    }

    /**
     * 获取某个日期所在的星期一和星期天
     *
     * @param  {Date} date 日期
     * @return {Array.<Date>}     星期一和星期天
     */
    static getWeek(date) {
        let time = date.getTime();
        let day = date.getDay();
        let timeOfDay = 24 * 60 * 60 * 1000;

        if (day === 0) {
            return [
                new Date(time - 6 * timeOfDay),
                new Date(time)
            ];
        }

        return [
            new Date(time - (day - 1) * timeOfDay),
            new Date(time + (7 - day) * timeOfDay)
        ];
    }

    /**
     * 获取某个开始日期和结束日期之间的所有星期一和星期天
     *
     * @param  {Date} startDate 开始日期
     * @param  {Date} endDate   结束日期
     * @return {Array.<Object>} 所有星期一和星期天
     */
    static getRangeWeeks(startDate, endDate) {
        let startTime = startDate.getTime();
        let endTime = endDate.getTime();
        let timeOfDay = 24 * 60 * 60 * 1000;
        let weeks = [];

        while(endTime > startTime) {
            let [endWeekStart, endWeekEnd] = this.getWeek(endDate);
            weeks.push({
                start: endWeekStart,
                end: endWeekEnd
            });

            endDate = new Date(endTime - 7 * timeOfDay);
            endTime = endDate.getTime();
        }

        // 加上第一周
        let [startWeekStart, startWeekEnd] = this.getWeek(startDate);
        weeks.push({
            start: startWeekStart,
            end: startWeekEnd
        });

        return weeks;
    }

    static formatDate(date, splitter = '.') {
        return '' + date.getFullYear()
            + splitter
            + (date.getMonth() + 1)
            + splitter
            + (date.getDate());
    }
}
