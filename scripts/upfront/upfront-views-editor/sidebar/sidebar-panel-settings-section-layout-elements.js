(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section'
    ], function (SidebarPanel_Settings_Section) {
        return SidebarPanel_Settings_Section.extend({
            initialize: function () {
                this.settings = _([]);
                this.elements = _([]);
            },
            get_name: function () {
                return 'layout';
            },
            get_title: function () {
                return "Layout";
            },
            on_render: function () {
                this.elements.each(this.render_element, this);
            },
            render_element: function (element) {
                if(! element.draggable)
                    return;

                var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
                    me = this;
                element.remove();
                element.render();
                this.$el.find('.panel-section-content').append(element.el);
                element.$el.on('mousedown', function (e) {
                    // Trigger shadow element drag
                    var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
                        $shadow = $('[data-shadow='+element.shadow_id+']'),
                        main_off = $main.offset(),
                        pos = $shadow.position(),
                        off = $shadow.offset(),
                        target_off = element.$el.offset(),
                        h = $shadow.outerHeight(),
                        w = $shadow.outerWidth(),
                        $clone = element.$el.clone(),
                        clone_h = element.$el.outerHeight(),
                        clone_w = element.$el.outerWidth(),
                        $element_drag_wrapper = $('<div id="element-drag-wrapper" class="upfront-ui" />'),
                        $gutter = $('.upfront-grid-layout-gutter-left:first, .upfront-grid-layout-gutter-right:first');
                    $shadow.css({
                            position: "absolute",
                            top: ( e.pageY-( off.top-pos.top )-(h/2) ) ,
                            left: ( e.pageX-( off.left-pos.left )-(w/2) ),
                            visibility: "hidden",
                            zIndex: -1
                        })
                        .one('mousedown', function(e){
                            // console.log('Shadow mousing down');
                        })
                        .trigger(e)
                        .one('dragstart', function (e, ui) {
                            element.$el.addClass('element-drag-active');
                            $('body').append($element_drag_wrapper);
                            $clone.appendTo($element_drag_wrapper);
                            $clone.addClass('element-dragging');
                            $clone.css({
                                position: "absolute",
                                top: e.pageY - ( clone_h/2 ),
                                left: e.pageX - ( clone_w/2 ),
                                zIndex: 999
                            });
                        })
                        .on('drag', function (e, ui) {
                            var in_gutter = false;
                            $gutter.each(function(){
                                if ( in_gutter )
                                    return;
                                var off = $(this).offset(),
                                    w = $(this).width();
                                if ( e.pageX >= main_off.left && e.pageX >= off.left+10 && e.pageX <= off.left+w-10 )
                                    in_gutter = true;
                            });
                            if ( in_gutter )
                                $clone.addClass('element-dragging-no-drop');
                            else
                                $clone.removeClass('element-dragging-no-drop');
                            $clone.css({
                                top: e.pageY - ( clone_h/2 ),
                                left: e.pageX - ( clone_w/2 )
                            });
                        })
                        .one('dragstop', function (e, ui) {
                            element.$el.removeClass('element-drag-active');
                            $clone.remove();
                            $element_drag_wrapper.remove();
                        });
                });
            }
        });

    });
}(jQuery));