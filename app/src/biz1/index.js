import $ from 'jquery';
import _ from 'lodash';
import './index.less';
import tpl from './index.html';

export function start() {
    $('#main').html(_.template(tpl)({ abc: 'apple' }));
}
