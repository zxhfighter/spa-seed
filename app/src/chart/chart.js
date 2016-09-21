/**
 * @file 图形基类
 * @author zengxiaohui(zengxiaohui@baidu.com)
 */

export default class Chart {
    constructor(options) {
        this.options = options;
    }

    /**
     * 获取配置
     *
     * @return {Object} 属性配置
     */
    getOption() {
        return this.options;
    }

    /**
     * 设置配置
     *
     * @param  {Object} options 配置参数
     */
    setOption(options) {
        this.options = options;
    }

    /**
     * 缩放
     */
    resize() {

    }

    /**
     * 销毁实例
     */
    dispose() {

    }

    /**
     * 显示数据加载进度条
     */
    showLoading() {

    }

    /**
     * 隐藏进度条
     */
    hideLoading() {

    }

    /**
     * 获取图形URL，便于下载
     */
    getDataURL() {

    }
}
