import $ from 'jquery';

$('#menu a').click(e => {
    let path = $(e.target).attr('path');
    console.log(path);
});
