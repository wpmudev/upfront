(function(){

    define([], function () {
        return {
            get_icon_html: function (src, classname) {
                if ( ! src )
                    return '';
                if ( src.match(/^https?:\/\//) ) {
                    var attr = {
                        'src': src,
                        'alt': '',
                        'class': 'upfront-field-icon-img'
                    };
                    return '<img ' + this.get_field_attr_html(attr) + ' />';
                }
                else {
                    var classes = ['upfront-field-icon'];
                    if ( ! classname ){
                        classes.push('upfront-field-icon-' + src);
                    }
                    else{
                        classes.push(classname);
                        classes.push(classname + '-' + src);
                    }
                    return '<i class="' + classes.join(' ') + '"></i>';
                }
            }
        };

    });
}());