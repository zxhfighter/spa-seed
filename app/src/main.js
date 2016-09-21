import $ from 'jquery';

$('#menu a').click(e => {
    let path = $(e.target).attr('path');

    require.ensure([], function () {
        let file = require('./' + path + '.js');
        file.start && file.start();
    });
}).click();
