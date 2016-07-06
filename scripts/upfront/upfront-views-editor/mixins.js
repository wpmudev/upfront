(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
    ], function () {
        var Upfront_Icon_Mixin = {
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

        var Upfront_Scroll_Mixin = {
            stop_scroll_propagation: function ($el) {
                if($el.parent().hasClass('sidebar-panel-post-editor')) return;

                $el.on('DOMMouseScroll mousewheel', function(ev) {
                    var $this = $(this),
                        scrollTop = this.scrollTop,
                        scrollHeight = this.scrollHeight,
                        height = $this.outerHeight(),
                        delta = ev.originalEvent.wheelDelta,
                        up = delta > 0,
                        scroll = scrollHeight > height;

                    if ( !scroll )
                        return;

                    ev.stopPropagation();

                    var prevent = function() {
                        ev.preventDefault();
                        ev.returnValue = false;
                        return false;
                    };

                    if (!up && -delta > scrollHeight - height - scrollTop) {
                        // Scrolling down, but this will take us past the bottom.
                        $this.scrollTop(scrollHeight);
                        return prevent();
                    } else if (up && delta > scrollTop) {
                        // Scrolling up, but this will take us past the top.
                        $this.scrollTop(0);
                        return prevent();
                    }
                });
            }
        };

        return {
            Upfront_Scroll_Mixin: Upfront_Scroll_Mixin,
            Upfront_Icon_Mixin: Upfront_Icon_Mixin
        };
    });
}(jQuery));