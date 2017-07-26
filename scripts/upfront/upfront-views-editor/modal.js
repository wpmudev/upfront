(function($){

    define([], function () {
        return Backbone.View.extend({
            attributes: function () {
                return {
                    "class": "upfront-inline-modal upfront-ui upfront-no-select",
                    id: "upfront-inline-modal-"+this.cid
                };
            },
            initialize: function (opts) {
                this.options = opts;
                this.$to = opts.to;
                this.button_text = opts.button_text ? opts.button_text : Upfront.Settings.l10n.global.content.ok;
                this.button = typeof opts.button != 'undefined' ? opts.button : true;
                this.width = typeof opts.width != 'undefined' ? opts.width : '50%';
                this.top = typeof opts.top != 'undefined' ? opts.top : -1;
                this.left = typeof opts.left != 'undefined' ? opts.left : -1;
                this.right = typeof opts.right != 'undefined' ? opts.right : -1;
                this.keep_position = typeof opts.keep_position != 'undefined' ? opts.keep_position : true;
            },
            events: {
                "click": "on_click",
                "click .upfront-inline-modal-content": "on_click_content",
                "click .upfront-inline-modal-save": "on_click_save"
            },
            render: function () {
                this.$el.html(
                    '<div class="upfront-inline-modal-wrap">' +
                    '<div class="upfront-inline-modal-content"></div>' +
                    '</div>'
                );
                this.$el.hide();
            },
            open: function (render_callback, context, button) {
                var me = this,
                    $wrap = this.$el.find('.upfront-inline-modal-wrap'),
                    $content = this.$el.find('.upfront-inline-modal-content'),
                    $button = $('<button type="button" class="upfront-inline-modal-save">' + this.button_text + '</button>'),
                    css = {},
                    height, parent_height,
                    is_lightbox = context && context.for_view && context.for_view.$el.hasClass('upfront-region-side-lightbox');


                this._deferred = $.Deferred();
                this.$el.show();
                render_callback.apply(context, [$content, this.$el]);
                button = typeof button != 'undefined' ? button : this.button;
                if ( button )
                    $button.appendTo($content);
                // this.listenTo(Upfront.Events, "entity:region:deactivated", function(){
                // me.close(false);
                // });

                css.width = this.width;
                // if it is a lightbox, it is going to be a fixed position, no need to take scroll into calcs
                if (!is_lightbox && this.top >= 0 ) {
                    css.top = this.top;
                    css.bottom = 'auto';
                }
                else {
                    parent_height = this.$el.height() > $(window).height() ? $(window).height() : this.$el.height();
                    height = $content.outerHeight();
                    this.top = parent_height-height > 0 ? (parent_height-height)/2 : 0;

                    // if it is a lightbox, just add manual margin from top, rest is static.
                    if(is_lightbox)
                        this.top = 22;

                    css.top = this.top;
                    css.bottom = 'auto';
                }

                if ( this.left >= 0 ) {
                    css.left = this.left;
                    css.right = 'auto';
                }
                else if ( this.right >= 0 ) {
                    css.left = 'auto';
                    if (css.width > 0 && this.right + css.width <= $(window).width()) { // We need this for smaller screens, such as laptops
                        css.right = this.right;
                      	// if small screen, push modal over from being cut off.
												if (window.innerWidth < 1366) {
													css.right = css.width;
												}
                    }
                }
                $wrap.css(css);
                if ( this.keep_position ) {
                    this.update_pos();
                    $(window).on('scroll', this, this.on_scroll);
                }
                this.trigger('modal:open');
                return this._deferred.promise();
            },
            close: function (save) {
                this.$el.hide();
                $(window).off('scroll', this.on_scroll);
                this.trigger('modal:close');
                if ( ! this._deferred )
                    return;
                if ( save )
                    this._deferred.resolve(this);
                else
                    this._deferred.reject(this);
            },
            on_scroll: function (e) {
                var me = e.data;
                me.update_pos();
            },
            on_click: function () {
                this.close(false);
            },
            on_click_content: function (e) {
                e.stopPropagation();
            },
            on_click_save: function () {
                this.close(true);
            },
            update_pos: function () {
                var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
                if ( this.$el.css('display') == 'none' )
                    return;
                var	$wrap = this.$el.find('.upfront-inline-modal-wrap'),
                    offset = this.$to.offset(),
                    top = offset.top,
                    bottom = top + this.$to.outerHeight(),
                    win_height = $(window).height(),
                    scroll_top = $(document).scrollTop(),
                    scroll_bottom = scroll_top + win_height,
                    rel_top = $main.offset().top,
                    rel_bottom = 50,
                    modal_offset = this.$el.offset(),
                    modal_right = modal_offset.left+this.$el.width(),
                    modal_height = this.$el.find('.upfront-inline-modal-wrap').outerHeight(),
                    modal_bottom = top + modal_height
                    ;
                if ( scroll_top >= top-rel_top ) {
                    if ( this.$el.css('position') != 'fixed' ){
                        this.$el.css({
                            position: 'fixed',
                            top: 0,
                            bottom: 0,
                            left: modal_offset.left,
                            right: $(window).width()-modal_right
                        });
                        $wrap.css({
                            top: rel_top + this.top
                        });
                    }
                }
                else if ( ( bottom > modal_bottom ? bottom : modal_bottom )+rel_bottom > scroll_bottom ) {
                    if ( this.$el.css('position') != 'fixed' ){
                        this.$el.css({
                            position: 'fixed',
                            top: 0,
                            bottom: 0,
                            left: modal_offset.left,
                            right: $(window).width()-modal_right
                        });
                        $wrap.css({
                            top: ( bottom > modal_bottom ? win_height-(bottom-top > win_height ? win_height : bottom-top)-rel_bottom : win_height-modal_height-rel_bottom ) + this.top
                        });
                    }
                }
                else {
                    this.$el.css({
                        position: '',
                        top: '',
                        bottom: '',
                        left: '',
                        right: ''
                    });
                    $wrap.css({
                        top: this.top
                    });
                }
            }
        });
    });
}(jQuery));
