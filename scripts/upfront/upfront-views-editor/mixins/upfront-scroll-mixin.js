(function($){

    define([], function ( ) {

        return {
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

    });
}(jQuery));