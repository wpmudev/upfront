(function($){

    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;

    define([
        "scripts/upfront/inline-panels/inline-panels",
        'scripts/upfront/upfront-views-editor/region/region-panel-add'
    ], function ( InlinePanels, RegionPanel_Add ) {
        return InlinePanels.Panels.extend({
            className: 'upfront-inline-panels upfront-region-panels upfront-ui',
            initialize: function () {
                var container = this.model.get('container'),
                    name = this.model.get('name');
                this.listenTo(this.model.collection, 'add', this.render);
                this.listenTo(this.model.collection, 'remove', this.render);
                this.listenTo(this.model.get("properties"), 'change', this.render);
                this.listenTo(this.model.get("properties"), 'add', this.render);
                this.listenTo(this.model.get("properties"), 'remove', this.render);
                this.listenTo(Upfront.Events, "entity:region:activated", this.on_region_active);
                this.listenTo(Upfront.Events, "entity:region:deactivated", this.on_region_deactive);
                //this.listenTo(Upfront.Events, "command:region:edit_toggle", this.update_pos);
                //this.edit_panel = new RegionPanel_Edit({model: this.model});
                //this.delete_panel = new RegionPanel_Delete({model: this.model});
                this.add_panel_top = new RegionPanel_Add({model: this.model, to: 'top'});
                this.add_panel_bottom = new RegionPanel_Add({model: this.model, to: 'bottom'});
                if (this.model.is_main() && this.model.get('allow_sidebar')) {
                    this.add_panel_left = new RegionPanel_Add({model: this.model, to: 'left'});
                    this.add_panel_right = new RegionPanel_Add({model: this.model, to: 'right'});
                }
                //this.listenTo(Upfront.Events, "theme_colors:update", this.update_colors);
                //this.listenTo(Upfront.Events, "entity:region:after_render", this.update_colors);
            },
            panels: function () {
                var panels = _([]),
                    collection = this.model.collection
                    ;
                if (_.isUndefined(collection)) { // The collection can easily be undefined for some reason. This happens e.g. when switching back from post layouts editing mode in exporter
                    this._panels = panels; // This is so we don't error out a bit later on
                    return panels; // Same as this - "return false" doesn't play well here.
                }
                var // Well, all is goog with the collection, so carry on as intended...
                    index_container = collection.index_container(this.model, ['shadow', 'lightbox']),
                    total_container = collection.total_container(['shadow', 'lightbox']), // don't include shadow and lightbox region
                    is_top = index_container == 0,
                    is_bottom = index_container == total_container - 1,
                    is_full = this.model.get('type') == 'full';
                if (this.model.is_main()) {
                    var sub_models = this.model.get_sub_regions();
                    if (!(is_full && is_top))
                        panels.push(this.add_panel_top);
                    if (this.model.get('allow_sidebar')) {
                        if (sub_models.left === false)
                            panels.push(this.add_panel_left);
                        if (sub_models.right === false)
                            panels.push(this.add_panel_right);
                    }
                    panels.push(this.add_panel_bottom);
                }
                this._panels = panels;
                return panels;
            },
            on_render: function () {
                this.update_pos();
            },
            on_scroll: function (e) {
                var me = e.data;
                me.update_pos();
            },
            on_region_active: function (region) {
                if (region.model != this.model)
                    return;
                var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
                if ($main.hasClass('upfront-region-editing')) {
                    this.on_active();
                    this.listenToOnce(Upfront.Events, 'sidebar:toggle:done', this.update_pos);
                    $(window).on('scroll', this, this.on_scroll);
                }
            },
            on_region_deactive: function () {
                $(window).off('scroll', this, this.on_scroll);
            },
            /*
             update_colors: function () {
             var $region = [],
             background = this.model.get_property_value_by_name("background_color")
             ;
             if (!background || !background.match(/ufc/)) return false;
             $region = this.$el.closest('.upfront-region-container-bg');
             if (!$region.length) return false;

             $region.css("background-color", Upfront.Util.colors.get_color(background));
             },
             */
            update_pos: function () {
                var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
                    $container = this.$el.closest('.upfront-region-container'),
                    $region = this.$el.closest('.upfront-region'),
                    $sub_top = $container.find('.upfront-region-side-top'),
                    $sub_bottom = $container.find('.upfront-region-side-bottom');

                if (( !$main.hasClass('upfront-region-editing') && !$main.hasClass('upfront-region-fixed-editing') && !$main.hasClass('upfront-region-lightbox-editing') ) || !$container.hasClass('upfront-region-container-active'))
                    return;

                var me = this,
                    offset = $region.offset(),
                    top = offset.top,
                    bottom = top + $region.outerHeight(),
                    top_height = $sub_top.length ? $sub_top.outerHeight() : 0,
                    bottom_height = $sub_bottom.length ? $sub_bottom.outerHeight() : 0,
                    win_height = $(window).height(),
                    scroll_top = $(document).scrollTop(),
                    scroll_bottom = scroll_top + win_height - bottom_height,
                    rel_top = $main.offset().top + top_height
                    ;

                this.add_responsive_items();

                /*this.$el.css({
                 top: scroll_top > top ? scroll_top-top+25 : 0,
                 bottom: bottom > scroll_bottom ? bottom-scroll_bottom : 0
                 });*/
                this._panels.each(function (panel) {
                    var panel_offset = panel.$el.offset();
                    if (panel.position_v == 'top' && scroll_top > top - rel_top && scroll_top < bottom - rel_top) {
                        if (panel.$el.css('position') != 'fixed')
                            panel.$el.css({
                                position: 'fixed',
                                top: rel_top,
                                left: panel_offset.left,
                                right: 'auto'
                            });
                    }
                    else if (panel.position_v == 'bottom' && bottom > scroll_bottom && top < scroll_bottom) {
                        if (panel.$el.css('position') != 'fixed')
                            panel.$el.css({
                                position: 'fixed',
                                bottom: bottom_height,
                                left: panel_offset.left,
                                right: 'auto'
                            });
                    }
                    else if (panel.position_v == 'center' && ( scroll_top > top - rel_top || bottom > scroll_bottom )) {
                        var panel_top = scroll_top > top - rel_top ? rel_top : top - scroll_top,
                            panel_bottom = bottom > scroll_bottom ? 0 : scroll_bottom - bottom,
                            panel_left = panel.position_h == 'left' ? panel_offset.left : 'auto',
                            panel_right = panel.position_h == 'right' ? $(window).width() - panel_offset.left - panel.$el.width() : 'auto';
                        if (panel.$el.css('position') != 'fixed')
                            panel.$el.css({
                                position: 'fixed',
                                top: panel_top,
                                bottom: panel_bottom,
                                left: panel_left,
                                right: panel_right
                            });
                        else
                            panel.$el.css({
                                top: panel_top,
                                bottom: panel_bottom
                            });
                    }
                    else {
                        panel.$el.css({
                            position: '',
                            top: '',
                            bottom: '',
                            left: '',
                            right: ''
                        });
                    }
                });

                setTimeout(
                    function () {
                        me.update_padding();
                    },
                    300
                );
            },
            update_padding: function () {
                var props = {},
                    $region = this.$el.closest('.upfront-region')
                    ;

                // Padding settings
                this.model.get("properties").each(function (prop) {
                    props[prop.get("name")] = prop.get("value");
                });

                var breakpoints = typeof Upfront.Settings.LayoutEditor.Theme.breakpoints !== 'undefined' ? Upfront.Settings.LayoutEditor.Theme.breakpoints : [],
                    current_breakpoint = typeof Upfront.Settings.LayoutEditor.CurrentBreakpoint !== 'undefined' ? Upfront.Settings.LayoutEditor.CurrentBreakpoint : 'desktop',
                    current_breakpoint_id = current_breakpoint === 'default' ? current_breakpoint : current_breakpoint.id,
                    top_padding,
                    bottom_padding
                    ;

                var breakpoint_obj = (
                        typeof props.breakpoint !== 'undefined'
                        && typeof props.breakpoint[current_breakpoint_id] !== 'undefined'
                    )
                        ? props.breakpoint[current_breakpoint_id]
                        : false
                    ;

                top_padding = (typeof breakpoint_obj.top_bg_padding_num !== 'undefined')
                    ? breakpoint_obj.top_bg_padding_num
                    : (typeof props.top_bg_padding_num !== 'undefined')
                    ? props.top_bg_padding_num
                    : false
                ;

                bottom_padding = (typeof breakpoint_obj.bottom_bg_padding_num !== 'undefined')
                    ? breakpoint_obj.bottom_bg_padding_num
                    : (typeof props.bottom_bg_padding_num !== 'undefined')
                    ? props.bottom_bg_padding_num
                    : false
                ;

                $region.css({
                    'padding-top': ( false === top_padding ? '' : top_padding + 'px' ),
                    'padding-bottom': ( false === bottom_padding ? '' : bottom_padding + 'px' )
                });
            },
            add_responsive_items: function () {
                var me = this,
                    $regionEl = me.$el.parents('.upfront-region'),
                    sub_models = me.model.get_sub_regions(),
                    openItemControls = $('<span class="open-responsive-item-controls"></span>'),
                    itemControls = $('<div class="responsive-item-controls">' + l10n.add_region + '</div>'),
                    responsiveAddRegionTop = $('<div class="responsive-item-control responsive-add-region-top">' + l10n.above + '</div>'),
                    responsiveAddRegionBottom = $('<div class="responsive-item-control responsive-add-region-bottom">' + l10n.below + '</div>'),
                    responsiveAddRegionLeft = $('<div class="responsive-item-control responsive-add-region-left">' + l10n.left_sidebar + '</div>'),
                    responsiveAddRegionRight = $('<div class="responsive-item-control responsive-add-region-right">' + l10n.right_sidebar + '</div>')
                    ;

                if ($regionEl.find('.open-responsive-item-controls').length === 0) {
                    openItemControls.click(function () {
                        $regionEl.toggleClass('controls-visible');
                    });
                    $regionEl.append(openItemControls);
                }

                responsiveAddRegionTop.click(function () {
                    me.add_panel_top.$el.find('.upfront-icon').trigger('click');
                    $regionEl.toggleClass('controls-visible');
                });
                itemControls.append(responsiveAddRegionTop);

                responsiveAddRegionBottom.click(function () {
                    me.add_panel_bottom.$el.find('.upfront-icon').trigger('click');
                    $regionEl.toggleClass('controls-visible');
                });
                itemControls.append(responsiveAddRegionBottom);

                if (me.model.is_main() && this.model.get('allow_sidebar')) {
                    if (sub_models.left === false) {
                        responsiveAddRegionLeft.click(function () {
                            me.add_panel_left.$el.find('.upfront-icon').trigger('click');
                            $regionEl.toggleClass('controls-visible');
                        });
                        itemControls.append(responsiveAddRegionLeft);
                    }
                    if (sub_models.right === false) {
                        responsiveAddRegionRight.click(function () {
                            me.add_panel_right.$el.find('.upfront-icon').trigger('click');
                            $regionEl.toggleClass('controls-visible');
                        });
                        itemControls.append(responsiveAddRegionRight);
                    }
                }
                $regionEl.find('.responsive-item-controls').remove();
                $regionEl.append(itemControls);
            },
            remove: function () {
                //this.edit_panel.remove();
                //this.delete_panel.remove();
                this.add_panel_top.remove();
                this.add_panel_bottom.remove();
                this.edit_panel = false;
                this.delete_panel = false;
                this.add_panel_top = false;
                this.add_panel_bottom = false;
                if (this.model.is_main() && this.model.get('allow_sidebar')) {
                    this.add_panel_left.remove();
                    this.add_panel_right.remove();
                    this.add_panel_left = false;
                    this.add_panel_right = false;
                }
                $(window).off('scroll', this, this.on_scroll);
                Backbone.View.prototype.remove.call(this);
            }
        });

    });
}(jQuery));