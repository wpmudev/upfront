(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/modal',
        'scripts/upfront/upfront-views-editor/fields',
        "text!upfront/templates/region_edit_panel.html"
    ], function (Modal, Fields, region_edit_panel_tpl) {


        return Modal.extend({
            open: function () {
                return this.constructor.__super__.open.call(this, this.render_modal, this, true);
            },
            render_modal: function ($content, $modal) {
                var me = this,
                    grid = Upfront.Settings.LayoutEditor.Grid,
                    breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
                    is_responsive = ( breakpoint && !breakpoint['default'] ),
                    is_layout = ( this.model instanceof Upfront.Models.Layout ),
                    is_region = ( this.model instanceof Upfront.Models.Region ),
                    sub = is_region && this.model.is_main() ? false : this.model.get('sub'),
                    bg_image = this.model.get_breakpoint_property_value('background_image', true),
                    $template = $(region_edit_panel_tpl),
                    setting_cback = _.template($template.find('#upfront-region-bg-setting').html()),
                    setting = setting_cback(),
                    region_types = [
                        { label: l10n.solid_color, value: 'color', icon: 'color' },
                        { label: l10n.image, value: 'image', icon: 'image' },
                        { label: l10n.video, value: 'video', icon: 'video' }
                    ]
                    ;

                if ( !is_layout ) {
                    region_types.push({ label: l10n.image_slider, value: 'slider', icon: 'slider' });
                    region_types.push({ label: l10n.map, value: 'map', icon: 'map' });
                }
                if (
                    _upfront_post_data.post_id
                    ||
                    (Upfront.Application.is_builder() && 'type' in _upfront_post_data.layout && 'single' === _upfront_post_data.layout.type)
                ) {
                    if (!('item' in _upfront_post_data.layout && _upfront_post_data.layout.item.match(/single-404/))) region_types.push({ label: l10n.featured_image, value: 'featured', icon: 'feat' });
                }

                var	bg_type = new Fields.Select({
                        model: this.model,
                        property: 'background_type',
                        use_breakpoint_property: true,
                        default_value: !bg_image ? 'color' : 'image',
                        icon_class: 'upfront-region-field-icon',
                        values: region_types,
                        change: function () {
                            var value = this.get_value();
                            this.model.set_breakpoint_property(this.property_name, value);
                            $content.find('.upfront-region-bg-setting-tab').not('.upfront-region-bg-setting-tab-'+value).hide();
                            $content.find('.upfront-region-bg-setting-tab-'+value).show();
                            me.render_modal_tab(value, $content.find('.upfront-region-bg-setting-tab-'+value), $content);
                        }
                    }),
                    bg_item = new Upfront.Views.Editor.BgSettings.BgItem({
                        model: this.model
                    }),
                    $region_header, $region_name, $region_global, $region_type, $region_nav, $region_behavior, $region_restrict, $region_sticky, $theme_body;

                if ( !is_responsive && is_region ) {
                    var region_name = new Fields.Text({
                            model: this.model,
                            name: 'title',
                            placeholder: l10n.region_name_placeholder,
                            compact: true,
                            change: function () {
                            },
                            blur: function () {
                                var collection = this.model.collection,
                                    prev_title = this.model.get('title'),
                                    prev_name = this.model.get('name'),
                                    title = $.trim(this.get_value().replace(/[^A-Za-z0-9\s_-]/g, '')), // strict filtering to prevent unwanted character
                                    name = title.toLowerCase().replace(/\s/g, '-'),
                                    new_title, sub_regions, region_css;
                                if ( prev_title != title ) {
                                    // Check if the region name exists
                                    if ( collection.get_by_name(name) ) {
                                        new_title = collection.get_new_title(title + " ", 2);
                                        title = new_title.title;
                                        name = new_title.name;
                                    }

                                    // Let's keep old CSS content
                                    region_css = me.get_region_css_styles(this.model);

                                    // Also update the container attribute on sub regions
                                    if ( this.model.is_main() ) {
                                        sub_regions = this.model.get_sub_regions();
                                        _.each(sub_regions, function(sub_model, sub){
                                            if ( _.isArray(sub_model) )
                                                _.each(sub_model, function(sub_model2){ sub_model2.set({container: name}, {silent:true}); });
                                            else if ( _.isObject(sub_model) )
                                                sub_model.set({container: name}, {silent:true});
                                        });
                                        this.model.set({title: title, name: name, container: name}, {silent: true});
                                    }
                                    else {
                                        this.model.set({title: title, name: name}, {silent: true});
                                    }
                                    $region_name.find('.upfront-region-name-edit-value').text(title);

                                    // Save to the new CSS
                                    me.set_region_css_styles(this.model, region_css.styles, region_css.selector);

                                    this.model.get('properties').trigger('change');
                                }
                            },
                            rendered: function () {
                                var me = this;
                                this.get_field().on('keyup', function(e){
                                    if ( e.which === 13 )
                                        me.trigger('blur');
                                });
                            }
                        }),
                        make_global = new Fields.Checkboxes({
                            model: this.model,
                            name: 'scope',
                            multiple: false,
                            values: [
                                { label: l10n.make_global, value: 'global' }
                            ],
                            change: function(){
                                var value = this.get_value();
                                if ( value == 'global' ){
                                    me.apply_region_scope(this.model, 'global');
                                    $region_name.find('.upfront-region-bg-setting-is-global').show();
                                }
                                //else {
                                //	me.apply_region_scope(this.model, 'local');
                                //}
                            }
                        }),
                        localize_region = new Fields.Button({
                            model: this.model,
                            name: 'localize',
                            label: l10n.localize_region,
                            classname: 'upfront-region-bg-setting-localize',
                            compact: true,
                            on_click: function () {
                                me.apply_region_scope(this.model, 'local');
                                $region_name.find('.upfront-region-bg-setting-name-wrap').show();
                                $region_auto.show();
                                $region_name.find('.upfront-region-bg-setting-name-edit').hide();
                                $region_name.find('.upfront-region-bg-setting-is-global').hide();
                                make_global.$el.find('[value=global]').prop('checked', false);
                                make_global.$el.show();
                                this.$el.hide();
                            },
                            rendered: function () {
                                this.$el.attr('title', l10n.localize_region_info);
                            }
                        }),
                        name_save = new Fields.Button({
                            model: this.model,
                            name: 'save',
                            label: l10n.save,
                            compact: true,
                            classname: 'upfront-region-bg-setting-name-save',
                            on_click: function () {
                                //region_name.trigger('blur');
                                $region_name.find('.upfront-region-bg-setting-name-wrap').show();
                                $region_auto.show();
                                $region_name.find('.upfront-region-bg-setting-name-edit').hide();
                                if ( this.model.get('scope') == 'global' ) {
                                    make_global.$el.hide();
                                    if ( !localize_region._no_display )
                                        localize_region.$el.show();
                                }
                                else {
                                    make_global.$el.show();
                                }
                            }
                        })
                        ;
                }
                if ( is_layout ){
                    var contained_region = new Fields.Number({
                        model: this.model,
                        property: 'contained_region_width',
                        label: l10n.contained_region_width,
                        label_style: "inline",
                        default_value: grid.size*grid.column_width,
                        min: grid.size*grid.column_width,
                        max: 5120,
                        step: 1,
                        suffix: l10n.px,
                        change: function () {
                            var value = this.get_value();
                            value = ( value < this.options.min ) ? this.options.min : value;
                            this.property.set({value: value});
                            Upfront.Events.trigger('upfront:layout:contained_region_width', value);
                        }
                    });
                }
                if ( is_region && this.model.is_main() ){
                    var global_regions = _.findWhere(Upfront.Application.current_subapplication.get_layout_data().properties, {name: 'global_regions'});
                    var global_header_defined = _.isUndefined(global_regions) ?
                        false : _.findWhere(global_regions.value, {name: 'header'});
                    var global_footer_defined = _.isUndefined(global_regions) ?
                        false : _.findWhere(global_regions.value, {name: 'footer'});

                    var collection = this.model.collection,
                        index = collection.indexOf(this.model),
                        index_container = collection.index_container(this.model, ['shadow', 'lightbox']),
                        total_container = collection.total_container(['shadow', 'lightbox']), // don't include shadow and lightbox region
                        is_top = index_container == 0,
                        is_bottom = index_container == total_container-1,
                        has_sticky = collection.findWhere({sticky: '1'}),
                        types = [
                            { label: l10n.full_width, value: 'wide' },
                            { label: l10n.contained, value: 'clip' }
                        ],
                        types = index_container > 0 ? types : _.union( [
                            { label: l10n.full_screen, value: 'full' }
                        ], types),
                        region_global = new Fields.Checkboxes({
                            model: this.model,
                            name: 'scope',
                            multiple: false,
                            values: [
                                { label: (is_top ? l10n.use_as_global_header : (is_bottom ? l10n.use_as_global_footer : '')), value: 'global' }
                            ],
                            change: function(){
                                var value = this.get_value(),
                                    sub_regions = this.model.get_sub_regions(),
                                    new_title = false,
                                    title = false,
                                    name = false,
                                    related_region = false;
                                if ( value == 'global' ){
                                    title = ( is_top ? l10n.header : ( is_bottom ? l10n.footer : '' ) );
                                    name = ( is_top ? 'header' : ( is_bottom ? 'footer' : '' ) );
                                    if ( title && name ){
                                        related_region = this.model.collection.get_by_name(name);
                                        if ( related_region && related_region != this.model ){ // make sure to rename other region with the same name and change the scope to local
                                            new_title = this.model.collection.get_new_title("Region ", total_container);
                                            me.apply_region_scope(related_region, 'local', new_title.name, new_title.title);
                                        }
                                        me.apply_region_scope(this.model, 'global', name, title);
                                    }
                                }
                                else {
                                    me.apply_region_scope(this.model, 'local');
                                }
                            }
                        }),
                        add_global_region = new Fields.Button({
                            model: this.model,
                            label: is_top ? l10n.add_global_header : l10n.add_global_footer,
                            info: (is_top ? l10n.layout_no_global_header : l10n.layout_no_global_footer),
                            compact: true,
                            on_click: function(e){
                                e.preventDefault();
                                var new_region = new Upfront.Models.Region( is_top ? global_header_defined : global_footer_defined ),
                                    related_region = this.model.collection.get_by_name( is_top ? 'header' : 'footer' ),
                                    new_title = false;
                                if ( related_region ) {// make sure to rename other region with the same name and change the scope to local
                                    new_title = this.model.collection.get_new_title("Region ", total_container);
                                    me.apply_region_scope(related_region, 'local', new_title.name, new_title.title);
                                }
                                Upfront.Events.once('entity:region:added', function(view){
                                    view.trigger("activate_region", view);
                                }, this);
                                new_region.add_to( this.model.collection, ( is_top ? 0 : index+1 ) );
                                me.close();
                            }
                        }),
                        region_type = new Fields.Radios({
                            model: this.model,
                            name: 'type',
                            default_value: 'wide',
                            layout: 'horizontal-inline',
                            values: types,
                            change: function () {
                                var value = this.get_value();
                                this.model.set({type: value}, {silent: true});
                                if ( value == 'full' ){
                                    $region_nav.show();
                                    $region_behavior.show();
                                }
                                else {
                                    $region_nav.hide();
                                    $region_behavior.hide();
                                }
                                this.model.get('properties').trigger('change');
                                me.update_pos();
                                // Re-toggle editing
                                Upfront.Events.trigger('command:region:edit_toggle', false);
                                Upfront.Events.trigger('command:region:edit_toggle', true);
                            }
                        }),
                    // backward compatible with old nav_region property
                        region_nav_value = this.model.get_property_value_by_name('nav_region'),
                        region_nav = new Fields.Checkboxes({
                            model: this.model,
                            property: 'sub_regions',
                            default_value: !this.model.get_property_value_by_name('sub_regions') ? [region_nav_value] : [],
                            layout: 'horizontal-inline',
                            multiple: true,
                            values: [
                                { label: l10n.top, value: 'top' },
                                { label: l10n.bottom, value: 'bottom' }
                            ],
                            change: function () {
                                var value = this.get_value(),
                                    sub_regions = me.model.get_sub_regions(),
                                    copy_data = false;
                                index = collection.indexOf(me.model);

                                if ( !_.contains(value, 'top') && sub_regions.top ) {
                                    copy_data = Upfront.Util.model_to_json(sub_regions.top);
                                    me._sub_region_top_copy = new Upfront.Models.Region(copy_data);
                                    collection.remove(sub_regions.top);
                                }
                                if ( !_.contains(value, 'bottom') && sub_regions.bottom ) {
                                    copy_data = Upfront.Util.model_to_json(sub_regions.bottom);
                                    me._sub_region_bottom_copy = new Upfront.Models.Region(copy_data);
                                    collection.remove(sub_regions.bottom);
                                }

                                _.each(value, function(sub){
                                    if ( sub_regions[sub] )
                                        return;
                                    var add_region = false,
                                        region_model = false;
                                    if ( sub == 'bottom' ) {
                                        if ( me._sub_region_bottom_copy )
                                            region_model = me._sub_region_bottom_copy;
                                        add_region = sub_regions.right ? index+2 : index+1;
                                    }
                                    else if ( sub == 'top' ) {
                                        if ( me._sub_region_top_copy )
                                            region_model = me._sub_region_top_copy;
                                        add_region = sub_regions.left ? index-1 : index;
                                    }
                                    if ( add_region !== false ) {
                                        var name = me.model.get('name') + '_' + sub,
                                            title = me.model.get('title') + ' ' + sub;
                                        if ( region_model === false ){
                                            region_model = new Upfront.Models.Region(_.extend(_.clone(Upfront.data.region_default_args), {
                                                "name": name,
                                                "title": title,
                                                "container": me.model.get('name'),
                                                "sub": sub,
                                                "scope": me.model.get('scope')
                                            }));
                                        }
                                        region_model.add_to(collection, add_region, {sub: sub});
                                        Upfront.Events.trigger('command:region:edit_toggle', true);
                                    }
                                });
                                this.property.set({value: value});
                            }
                        }),
                        region_behavior = new Fields.Radios({
                            model: this.model,
                            name: 'behavior',
                            default_value: 'keep-position',
                            layout: 'horizontal-inline',
                            values: [
                                { label: l10n.keep_position, value: 'keep-position' },
                                { label: l10n.keep_ratio, value: 'keep-ratio' }
                            ],
                            change: function () {
                                var value = this.get_value();
                                this.model.set({behavior: value}, {silent: true});
                                this.model.get('properties').trigger('change');
                            }
                        });
                }
                else if ( is_region && sub == 'fixed' ) {
                    var region_restrict = new Fields.Checkboxes({
                        model: this.model,
                        name: 'restrict_to_container',
                        default_value: '',
                        layout: 'horizontal-inline',
                        values: [
                            { label: l10n.restrict_to_parent, value: '1' }
                        ],
                        change: function () {
                            var value = this.get_value();
                            this.model.set({restrict_to_container: value}, {silent: true});
                            this.model.trigger('restrict_to_container', value);
                            this.model.get('properties').trigger('change');
                        },
                        multiple: false
                    });
                }

                //Render padding settings only for regions
                if ( is_region ) {

                    // Padding Settings
                    var bg_padding_type = new Fields.Radios({
                            model: this.model,
                            use_breakpoint_property: true,
                            property: 'bg_padding_type',
                            label: '',
                            values: [{ label: l10n.varied_padding, value: 'varied' }, { label: l10n.equal_padding, value: 'equal' }],
                            default_value: this.model.get_breakpoint_property_value('bg_padding_type') || 'varied',
                            change: function () {
                                this.model.set_breakpoint_property('bg_padding_type', this.get_value());
                            },
                            show: function (value, $el) {
                                if(value === 'varied') {
                                    $('.upfront-region-bg-setting-padding-top', $content).show();
                                    $('.upfront-region-bg-setting-padding-bottom', $content).show();
                                    $('.upfront-region-bg-setting-equal-padding', $content).hide();
                                }
                                else {
                                    $('.upfront-region-bg-setting-equal-padding', $content).show();
                                    $('.upfront-region-bg-setting-padding-top', $content).hide();
                                    $('.upfront-region-bg-setting-padding-bottom', $content).hide();
                                }
                            }
                        }),
                        top_bg_padding_slider = new Fields.Slider({
                            model: this.model,
                            use_breakpoint_property: true,
                            property: 'top_bg_padding_slider',
                            label: '',
                            default_value: this.model.get_breakpoint_property_value('top_bg_padding_slider') || 0,
                            min: 0,
                            max: 200,
                            step: 5,
                            valueTextFilter: function () {return '';},
                            change: function () {
                                var value = this.get_value();

                                this.model.set_breakpoint_property('top_bg_padding_slider', value);
                                top_bg_padding_num.get_field().val(value);
                                this.model.set_breakpoint_property('top_bg_padding_num', value, true);
                            }
                        }),
                        top_bg_padding_num = new Fields.Number({
                            model: this.model,
                            use_breakpoint_property: true,
                            property: 'top_bg_padding_num',
                            label: '',
                            default_value: this.model.get_breakpoint_property_value('top_bg_padding_num') || 0,
                            prefix: l10n.bottom_padding,
                            suffix: l10n.px,
                            min: 0,
                            step: 5,
                            change: function () {
                                var value = this.get_value();

                                this.model.set_breakpoint_property('top_bg_padding_num', value);
                                this.model.set_breakpoint_property('top_bg_padding_slider', value, true);
                                top_bg_padding_slider.$el.find('#'+top_bg_padding_slider.get_field_id()).slider('value', value);
                            }
                        }),
                        bottom_bg_padding_slider = new Fields.Slider({
                            model: this.model,
                            use_breakpoint_property: true,
                            property: 'bottom_bg_padding_slider',
                            label: '',
                            default_value: this.model.get_breakpoint_property_value('bottom_bg_padding_slider') || 0,
                            min: 0,
                            max: 200,
                            step: 5,
                            valueTextFilter: function () {return '';},
                            change: function () {
                                var value = this.get_value();

                                this.model.set_breakpoint_property('bottom_bg_padding_slider', value);
                                bottom_bg_padding_num.get_field().val(value);
                                this.model.set_breakpoint_property('bottom_bg_padding_num', value, true);
                            }
                        }),
                        bottom_bg_padding_num = new Fields.Number({
                            model: this.model,
                            use_breakpoint_property: true,
                            property: 'bottom_bg_padding_num',
                            label: '',
                            default_value: this.model.get_breakpoint_property_value('bottom_bg_padding_num') || 0,
                            suffix: l10n.px,
                            min: 0,
                            step: 5,
                            change: function () {
                                var value = this.get_value();

                                this.model.set_breakpoint_property('bottom_bg_padding_num', value);
                                this.model.set_breakpoint_property('bottom_bg_padding_slider', value, true);
                                bottom_bg_padding_slider.$el.find('#'+bottom_bg_padding_slider.get_field_id()).slider('value', value);
                            }
                        }),
                        bg_padding_slider = new Fields.Slider({
                            model: this.model,
                            use_breakpoint_property: true,
                            property: 'bg_padding_slider',
                            label: '',
                            default_value: this.model.get_breakpoint_property_value('bg_padding_slider') || 0,
                            min: 0,
                            max: 200,
                            step: 5,
                            valueTextFilter: function () {return '';},
                            change: function () {
                                var value = this.get_value();

                                this.model.set_breakpoint_property('bg_padding_slider', value);
                                this.model.set_breakpoint_property('top_bg_padding_slider', value, true);
                                this.model.set_breakpoint_property('bottom_bg_padding_slider', value, true);
                                top_bg_padding_slider.$el.find('#'+top_bg_padding_slider.get_field_id()).slider('value', value);
                                bottom_bg_padding_slider.$el.find('#'+bottom_bg_padding_slider.get_field_id()).slider('value', value);
                                bg_padding_num.get_field().val(value);
                                top_bg_padding_num.get_field().val(value);
                                bottom_bg_padding_num.get_field().val(value);
                                this.model.set_breakpoint_property('bg_padding_num', value, true);
                                this.model.set_breakpoint_property('top_bg_padding_num', value, true);
                                this.model.set_breakpoint_property('bottom_bg_padding_num', value, true);
                            }
                        }),
                        bg_padding_num = new Fields.Number({
                            model: this.model,
                            use_breakpoint_property: true,
                            property: 'bg_padding_num',
                            label: '',
                            default_value: this.model.get_breakpoint_property_value('bg_padding_num') || 0,
                            suffix: l10n.px,
                            min: 0,
                            step: 5,
                            change: function () {
                                var value = this.get_value();

                                this.model.set_breakpoint_property('bg_padding_num', value);
                                top_bg_padding_num.get_field().val(value);
                                bottom_bg_padding_num.get_field().val(value);
                                this.model.set_breakpoint_property('top_bg_padding_num', value, true);
                                this.model.set_breakpoint_property('bottom_bg_padding_num', value, true);
                                this.model.set_breakpoint_property('bg_padding_slider', value, true);
                                this.model.set_breakpoint_property('top_bg_padding_slider', value, true);
                                this.model.set_breakpoint_property('bottom_bg_padding_slider', value, true);
                                bg_padding_slider.$el.find('#'+bg_padding_slider.get_field_id()).slider('value', value);
                                top_bg_padding_slider.$el.find('#'+top_bg_padding_slider.get_field_id()).slider('value', value);
                                bottom_bg_padding_slider.$el.find('#'+bottom_bg_padding_slider.get_field_id()).slider('value', value);
                            }
                        })
                        ;
                }
                // Preserve background settings element event binding by detaching them before resetting html
                $content.find('.upfront-region-bg-setting-tab-primary, .upfront-region-bg-setting-tab-secondary').children().detach();

                $content.html(setting);
                $modal.addClass('upfront-region-modal-bg');
                $fixed = $content.find('.upfront-region-bg-setting-fixed-region');
                $fixed.hide();
                $lightbox = $content.find('.upfront-region-bg-setting-lightbox-region');

                $lightbox.hide();
                $region_header = $content.find('.upfront-region-bg-setting-header');
                $region_name = $content.find('.upfront-region-bg-setting-name');
                $region_global = $content.find('.upfront-region-bg-setting-region-global');
                $add_global_region = $content.find('.upfront-region-bg-setting-add-global-region');
                $region_type = $content.find('.upfront-region-bg-setting-region-type');
                $region_nav = $content.find('.upfront-region-bg-setting-region-nav');
                $region_behavior = $content.find('.upfront-region-bg-setting-region-behavior');
                $region_restrict = $content.find('.upfront-region-bg-setting-floating-restrict');
                $region_sticky = $content.find('.upfront-region-bg-setting-sticky');
                $region_auto = $content.find('.upfront-region-bg-setting-auto-resize');
                $region_padding_type = $content.find('.upfront-region-bg-setting-padding-type');
                $region_equal_padding = $content.find('.upfront-region-bg-setting-equal-padding');
                $region_top_padding = $content.find('.upfront-region-bg-setting-padding-top');
                $region_bottom_padding = $content.find('.upfront-region-bg-setting-padding-bottom');

                if ( !is_responsive && is_region ) {
                    region_name.render();
                    make_global.render();
                    localize_region.render();
                    name_save.render();
                    $region_name.find('.upfront-region-bg-setting-name-edit').append([region_name.$el, make_global.$el, localize_region.$el, name_save.$el]).hide();
                    $region_name.find('.upfront-region-name-edit-value').text(this.model.get('title'));
                    if ( this.model.get('scope') == 'global' ) {
                        $region_name.find('.upfront-region-bg-setting-is-global').show();
                        make_global.$el.hide();
                        if ( !this.model.is_main() && sub ) {
                            var main_region = this.model.collection.get_by_name(this.model.get('container'));
                            if ( main_region && main_region.get('scope') == 'global' ){
                                localize_region.$el.hide();
                                localize_region._no_display = true;
                            }
                        }
                    }
                    else {
                        $region_name.find('.upfront-region-bg-setting-is-global').hide();
                        localize_region.$el.hide();
                    }
                    // Let's not allow name change for header/footer, as the name is reserved for global region
                    //if ( this.model.get('name') == 'header' || this.model.get('name') == 'footer' ){
                    //	$region_name.find('.upfront-region-name-edit-trigger').hide();
                    //}
                    //else {
                    $region_name.on('click', '.upfront-region-name-edit-trigger', function(e){
                        e.preventDefault();
                        $region_name.find('.upfront-region-bg-setting-name-wrap').hide();
                        $region_auto.hide();
                        $region_name.find('.upfront-region-bg-setting-name-edit').show();
                        if ( me.model.get('scope') != 'global' )
                            region_name.get_field().prop('disabled', false).trigger('focus').select();
                        else
                            region_name.get_field().prop('disabled', true);
                    });
                    //}
                }
                else {
                    $region_header.hide();
                }

                if ( !is_responsive && is_region && this.model.is_main() ) {
                    /*if ( is_top || is_bottom ){
                     // This is global header or footer, or there is no global header/footer - show checkbox
                     if (
                     (is_top && ( this.model.get('name') == 'header' || !global_header_defined ))
                     || (!is_top && is_bottom && ( this.model.get('name') == 'footer' || !global_footer_defined ) )
                     ) {
                     region_global.render();
                     $region_global.append(region_global.$el);
                     } else {
                     // There are global header/footer but not used on this layout yet
                     add_global_region.render();
                     $add_global_region.append(add_global_region.$el);
                     }
                     }*/
                    region_type.render();
                    $region_type.append(region_type.$el);
                    region_nav.render();
                    $region_nav.append(region_nav.$el);
                    region_behavior.render();
                    $region_behavior.append(region_behavior.$el);
                }
                else {
                    $region_global.hide();
                    $region_type.hide();
                    $region_nav.hide();
                    $region_behavior.hide();
                    $region_auto.hide();
                }
                $region_restrict.hide();
                $region_sticky.hide();

                if ( !is_responsive && is_region && ( this.model.is_main() || sub == 'top' || sub == 'bottom' ) ) {
                    // Show the sticky option if there's no sticky region yet AND the region is <= 300px height
                    if ( ( !has_sticky && this.for_view.$el.height() <= 300 ) || this.model.get('sticky') ) {
                        var region_sticky = new Fields.Checkboxes({
                            model: this.model,
                            name: 'sticky',
                            default_value: '',
                            layout: 'horizontal-inline',
                            values: [
                                { label: l10n.sticky_region, value: '1' }
                            ],
                            change: function () {
                                var value = this.get_value();
                                this.model.set({sticky: value}, {silent: true});
                                this.model.get('properties').trigger('change');
                            },
                            multiple: false
                        });
                        region_sticky.render();
                        $region_sticky.append(region_sticky.$el).show();
                    }
                }

                $theme_body = $content.find('.upfront-region-bg-setting-theme-body');
                if ( is_layout ) {
                    contained_region.render();
                    $theme_body.append(contained_region.$el);
                    $content.find('.upfront-region-bg-setting-edit-css').hide();
                }
                else {
                    $theme_body.hide();
                }

                if(this.model.attributes.sub != 'lightbox') { /* dont need too many background options for the lightbox */
                    bg_type.render();
                    $content.find('.upfront-region-bg-setting-type').append(bg_type.$el);
                    /*$content.find('.upfront-region-bg-setting-change-image').on('click', function (e) {
                     e.preventDefault();
                     e.stopPropagation();
                     me.upload_image();
                     });*/

                }
                else {
                    $content.find('.upfront-region-bg-setting-type').remove();
                    //$content.find('.upfront-region-bg-setting-change-image').remove();
                }

                $content.find('.upfront-region-bg-setting-edit-css').on('click', function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    me.trigger_edit_css();
                });

                if ( is_region && this.model.is_main() ){
                    var $auto_resize = $content.find('.upfront-region-bg-setting-auto-resize');
                    $auto_resize.on('click', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        me.trigger_expand_lock($(this));
                    });
                    this.render_expand_lock($auto_resize);
                    this.listenTo(region_type, 'changed', function(){
                        me.render_expand_lock($auto_resize);
                    });
                    if ( !is_responsive )
                        region_type.trigger('changed');
                }
                else if ( is_region && sub == 'fixed' ) {
                    this.render_fixed_settings($fixed);
                    $fixed.show();
                    region_restrict.render();
                    $region_restrict.append(region_restrict.$el).show();
                }
                else if ( is_region && sub == 'lightbox' ) {
                    this.render_lightbox_settings($lightbox);
                    $lightbox.show();
                }
                else {
                    $content.find('.upfront-region-bg-setting-auto-resize').hide();
                }

                //Render padding settings only for regions
                if ( is_region ){
                    // Padding Settings
                    bg_padding_type.render();
                    $region_padding_type.append(bg_padding_type.$el);
                    top_bg_padding_slider.render();
                    $region_top_padding.append(top_bg_padding_slider.$el);
                    top_bg_padding_num.render();
                    $region_top_padding.append(top_bg_padding_num.$el);
                    bottom_bg_padding_slider.render();
                    $region_bottom_padding.append(bottom_bg_padding_slider.$el);
                    bottom_bg_padding_num.render();
                    $region_bottom_padding.append(bottom_bg_padding_num.$el);
                    bg_padding_slider.render();
                    $region_equal_padding.append(bg_padding_slider.$el);
                    bg_padding_num.render();
                    $region_equal_padding.append(bg_padding_num.$el);
                }

                //Make sure we hide the padding markup from template
                if ( is_layout && !is_region ) {
                    $content.find('.upfront-region-bg-setting-padding').hide();
                }

                bg_type.trigger('changed');
            },
            on_close_modal: function () {
                var me = this;
                me._active = false;
                me.render_icon();
            },
            notify: function () {
                Upfront.Views.Editor.notify(l10n.bg_updated);
            },
            apply_region_scope: function (model, scope, name, title) {
                var me = this,
                    sub_regions = model.get_sub_regions(),
                    prev_title = model.get('title'),
                    prev_name = model.get('name'),
                    set_sub = function (region) {
                        var css = me.get_region_css_styles(region);
                        region.set({scope: scope}, {silent: true});
                        if ( name && prev_name != name ){
                            var title_rx = new RegExp('^' + prev_title, 'i'),
                                name_rx = new RegExp('^' + prev_name, 'i'),
                                sub_title = region.get('title').replace( title_rx, title ),
                                sub_name = region.get('name').replace( name_rx, name );
                            region.set({
                                container: name,
                                title: sub_title,
                                name: sub_name
                            }, {silent: true});
                        }
                        me.set_region_css_styles(region, css.styles, css.selector);
                        region.get('properties').trigger('change');
                    },
                    region_css;
                if ( model.is_main() ){
                    _.each(sub_regions, function(sub){
                        if ( _.isArray(sub) )
                            _.each(sub, function(each){ set_sub(each); });
                        else if ( sub )
                            set_sub(sub);
                    });
                }
                region_css = me.get_region_css_styles(model);
                model.set({ scope: scope }, {silent: true});
                if ( name && prev_name != name ){
                    model.set({
                        title: title,
                        name: name,
                        container: name
                    }, {silent: true});
                }
                me.set_region_css_styles(model, region_css.styles, region_css.selector);
                model.get('properties').trigger('change');
            },
            get_region_css_styles: function (model) {
                Upfront.Application.cssEditor.init({
                    model: model,
                    type: model.is_main() ? "RegionContainer" : "Region",
                    element_id: model.is_main() ? "region-container-" + model.get('name') : "region-" + model.get('name'),
                    no_render: true
                });
                return {
                    styles: $.trim(Upfront.Application.cssEditor.get_style_element().html()),
                    selector: Upfront.Application.cssEditor.get_css_selector()
                };
            },
            set_region_css_styles: function (model, styles, prev_selector) {
                if ( styles ) {
                    Upfront.Application.cssEditor.init({
                        model: model,
                        type: model.is_main() ? "RegionContainer" : "Region",
                        element_id: model.is_main() ? "region-container-" + model.get('name') : "region-" + model.get('name'),
                        no_stylename_fallback: true,
                        no_render: true
                    });
                    selector = Upfront.Application.cssEditor.get_css_selector();
                    if ( prev_selector != selector )
                        styles = styles.replace(new RegExp(prev_selector.replace(/^\./, '\.'), 'g'), selector);
                    Upfront.Application.cssEditor.get_style_element().html(styles);
                    Upfront.Application.cssEditor.saveCall(false);
                }
            },
            render_fixed_settings: function ($content) {
                var me = this,
                    grid = Upfront.Settings.LayoutEditor.Grid,
                    top = this.model.get_property_value_by_name('top'),
                    is_top = ( typeof top == 'number' ),
                    left = this.model.get_property_value_by_name('left'),
                    is_left = ( typeof left == 'number' ),
                    bottom = this.model.get_property_value_by_name('bottom'),
                    is_bottom = ( typeof bottom == 'number' ),
                    right = this.model.get_property_value_by_name('right'),
                    is_right = ( typeof right == 'number' ),
                    set_value = function () {
                        var value = this.get_value(),
                            saved = this.get_saved_value();
                        if ( value != saved ){
                            switch ( this.options.property ){
                                case 'top':
                                    this.model.remove_property('bottom', true); break;
                                case 'bottom':
                                    this.model.remove_property('top', true); break;
                                case 'left':
                                    this.model.remove_property('right', true); break;
                                case 'right':
                                    this.model.remove_property('left', true); break;
                            }
                            this.property.set({'value': parseInt(value, 10)});
                        }
                    },
                    fields = {
                        width: new Upfront.Views.Editor.Field.Number({
                            model: this.model,
                            property: 'width',
                            label: l10n.width + ':',
                            label_style: "inline",
                            min: 3 * grid.column_width,
                            max: Math.floor(grid.size/2) * grid.column_width,
                            change: set_value
                        }),
                        height: new Upfront.Views.Editor.Field.Number({
                            model: this.model,
                            property: 'height',
                            label: l10n.height + ':',
                            label_style: "inline",
                            min: 3 * grid.baseline,
                            change: set_value
                        })
                    };
                if ( is_top || !is_bottom )
                    fields.top = new Upfront.Views.Editor.Field.Number({
                        model: this.model,
                        property: 'top',
                        label: l10n.top + ':',
                        label_style: "inline",
                        min: 0,
                        change: set_value
                    });
                else
                    fields.bottom = new Upfront.Views.Editor.Field.Number({
                        model: this.model,
                        property: 'bottom',
                        label: l10n.bottom + ':',
                        label_style: "inline",
                        min: 0,
                        change: set_value
                    });
                if ( is_left || !is_right )
                    fields.left = new Upfront.Views.Editor.Field.Number({
                        model: this.model,
                        property: 'left',
                        label: l10n.left + ':',
                        label_style: "inline",
                        min: 0,
                        change: set_value
                    });
                else
                    fields.right = new Upfront.Views.Editor.Field.Number({
                        model: this.model,
                        property: 'right',
                        label: l10n.right + ":",
                        label_style: "inline",
                        min: 0,
                        change: set_value
                    });
                _.each(fields, function(field){
                    field.render();
                    field.delegateEvents();
                    $content.append(field.$el);
                });
            },
            render_lightbox_settings: function ($content) {
                var me = this,
                    grid = Upfront.Settings.LayoutEditor.Grid,
                /*top = this.model.get_property_value_by_name('top'),
                 is_top = ( typeof top == 'number' ),
                 left = this.model.get_property_value_by_name('left'),
                 is_left = ( typeof left == 'number' ),
                 bottom = this.model.get_property_value_by_name('bottom'),
                 is_bottom = ( typeof bottom == 'number' ),
                 right = this.model.get_property_value_by_name('right'),
                 is_right = ( typeof right == 'number' ),*/
                    set_value = function (object) {

                        me = object.$spectrum?object:this;

                        var value = me.get_value(),
                            saved = me.get_saved_value();
                        if ( value != saved ){
                            me.property.set({'value': value});
                        }
                    },
                    fields = {
                        width: new Upfront.Views.Editor.Field.Number({
                            model: this.model,
                            property: 'col',
                            className: 'upfront-field-wrap upfront-field-wrap-number width_cols',
                            label: l10n.col_width + ":",
                            label_style: "inline",
                            min: 3,// * grid.column_width,
                            max: 24,//Math.floor(grid.size/2) * grid.column_width,
                            change: set_value
                        }),
                        height: new Upfront.Views.Editor.Field.Number({
                            model: this.model,
                            property: 'height',
                            label: l10n.px_height + ":",
                            label_style: "inline",
                            min: 3 * grid.baseline,
                            max: 99999,
                            change: set_value
                        }),
                        click_out_close: new Upfront.Views.Editor.Field.Checkboxes({
                            model: this.model,
                            property: 'click_out_close',
                            label: "",
                            values: [
                                { label: l10n.click_close_ltbox, value: 'yes', checked: this.model.get_property_value_by_name('click_out_close') == 'yes' ? 'checked' : false }
                            ],
                            change: set_value
                        }),
                        show_close: new Upfront.Views.Editor.Field.Checkboxes({
                            model: this.model,
                            property: 'show_close',
                            label: "",
                            values: [
                                { label: l10n.show_close_icon, value: 'yes', checked: this.model.get_property_value_by_name('show_close') == 'yes' ? 'checked' : false }
                            ],
                            change: set_value
                        })/*,
                         add_close_text: new Upfront.Views.Editor.Field.Checkboxes({
                         model: this.model,
                         property: 'add_close_text',
                         label: "",
                         values: [
                         { label: l10n.add_close_text, value: 'yes', checked: this.model.get_property_value_by_name('add_close_text') == 'yes' ? 'checked' : false }
                         ],
                         change: set_value
                         }),
                         close_text: new Upfront.Views.Editor.Field.Text({
                         model: this.model,
                         default_value: l10n.close,
                         property: 'close_text',
                         label_style: "inline",
                         change: set_value
                         })*/
                    };

                fields.overlay_color = new Upfront.Views.Editor.Field.Color({
                    model: this.model,
                    property: 'overlay_color',
                    className: 'upfront-field-wrap upfront-field-wrap-color sp-cf overlay_color',
                    default_value: 'rgba(38,58,77,0.75)',
                    label: l10n.overlay_bg + ":",
                    change: set_value,
                    spectrum: {
                        move: function(color) {
                            var rgb = color.toRgb(),
                                rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')';
                            fields.overlay_color.get_field().val(rgba_string);
                            set_value(fields.overlay_color);
                        },
                        change: function(color) {
                            var rgb = color.toRgb(),
                                rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')';
                            fields.overlay_color.get_field().val(rgba_string);
                            set_value(fields.overlay_color);
                        }
                    }
                });

                fields.lightbox_color = new Upfront.Views.Editor.Field.Color({
                    model: this.model,
                    property: 'lightbox_color',
                    default_value: 'rgba(248,254,255,0.9)',
                    label: l10n.active_area_bg + ":",
                    change: set_value,
                    spectrum: {
                        move: function(color) {
                            var rgb = color.toRgb(),
                                rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')';
                            fields.lightbox_color.get_field().val(rgba_string);
                            set_value(fields.lightbox_color);
                        },
                        change: function(color) {
                            var rgb = color.toRgb(),
                                rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')';
                            fields.lightbox_color.get_field().val(rgba_string);
                            set_value(fields.lightbox_color);
                        }
                    }
                });

                _.each(fields, function(field){
                    field.render();
                    field.delegateEvents();
                    $content.append(field.$el);
                });

                this.model.set_property('delete', false);
                var me = this;

                $content.on('click', 'a.upfront-entity-delete_trigger', function() {
                    me.model.set_property('delete', true);
                    me.close();
                });

                $content.closest('.upfront-inline-modal-wrap').draggable();
            },
            update_lightbox_overlay: function(color) {
                var rgb = color.toRgb(),
                    rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')';
            },
            render_modal_tab: function (tab, $tab, $content) {
                var $change_image = $content.find('.upfront-region-bg-setting-change-image');
                $change_image.hide();
                switch (tab){
                    case 'color':
                        this.render_modal_tab_color($tab);
                        break;
                    case 'image':
                        $change_image.show();
                        this.render_modal_tab_image($tab, tab);
                        break;
                    case 'featured':
                        this.render_modal_tab_image($tab, tab);
                        break;
                    case 'slider':
                        this.render_modal_tab_slider($tab);
                        break;
                    case 'map':
                        this.render_modal_tab_map($tab);
                        break;
                    case 'video':
                        this.render_modal_tab_video($tab);
                        break;
                }
            },
            _render_tab_template: function($target, primary, secondary, template){
                var $template = $(region_edit_panel_tpl),
                    $tab = false, tpl = false
                    ;
                if (template) {
                    tpl = _.template($template.find('#upfront-region-bg-setting-tab-'+template).html());
                } else {
                    tpl = _.template($template.find('#upfront-region-bg-setting-tab').html());
                }
                if (tpl) $tab = $('<div>' + tpl() + '</div>');
                //$tab = $('<div>'+$template.find( template ? '#upfront-region-bg-setting-tab-'+template : '#upfront-region-bg-setting-tab').html()+'</div>');
                $tab.find('.upfront-region-bg-setting-tab-primary').append(primary);
                if ( secondary )
                    $tab.find('.upfront-region-bg-setting-tab-secondary').append(secondary);
                $target.html('');
                $target.append($tab);
            },
            // Color tab
            render_modal_tab_color: function ($tab) {
                if ( ! this._color_item ){
                    this._color_item = new Upfront.Views.Editor.BgSettings.ColorItem({
                        model: this.model
                    });
                    this._color_item.render();
                }
                this._color_item.trigger('show');
                this._render_tab_template($tab, this._color_item.$el, '');
            },
            // Image tab
            render_modal_tab_image: function ($tab, value) {
                if ( ! this._image_item ){
                    this._image_item = new Upfront.Views.Editor.BgSettings.ImageItem({
                        model: this.model
                    });
                    this._image_item.render();
                    this.$_image_primary = this._image_item.$el.find('.uf-bgsettings-image-style, .uf-bgsettings-image-pick');
                }
                this._image_item.trigger('show');
                this._render_tab_template($tab, this.$_image_primary, this._image_item.$el);
            },
            // Slider tab
            render_modal_tab_slider: function ($tab) {
                if ( ! this._slider_item ) {
                    this.$_slides = $('<div class="upfront-region-bg-slider-slides"></div>'),
                        this._slider_item = new Upfront.Views.Editor.BgSettings.SliderItem({
                            model: this.model,
                            slides_item_el: this.$_slides
                        });
                    this._slider_item.render();
                    this.$_slider_primary = this._slider_item.$el.find('.uf-bgsettings-slider-transition');
                }
                this._slider_item.trigger('show');
                this._render_tab_template($tab, this.$_slider_primary, [this._slider_item.$el, this.$_slides]);
            },
            // Map tab
            render_modal_tab_map: function ($tab) {
                if ( ! this._map_item ){
                    this._map_item = new Upfront.Views.Editor.BgSettings.MapItem({
                        model: this.model
                    });
                    this._map_item.render();
                }
                this._map_item.trigger('show');
                this._render_tab_template($tab, '', this._map_item.$el);
            },
            // Video tab
            render_modal_tab_video: function ($tab) {
                if ( ! this._video_item ) {
                    this._video_item = new Upfront.Views.Editor.BgSettings.VideoItem({
                        model: this.model
                    });
                    this._video_item.render();
                }
                this._video_item.trigger('show');
                this._render_tab_template($tab, '', this._video_item.$el);
            },
            // Expand lock trigger
            render_expand_lock: function ($el) {
                var locked = this.model.get_breakpoint_property_value('expand_lock', true),
                    type = this.model.get('type'),
                    $status = $('<span />');
                if ( type == 'full' ) {
                    $el.addClass('upfront-region-bg-setting-auto-resize-disabled');
                    $el.attr('title', l10n.auto_resize_disabled_title);
                }
                else {
                    $el.removeClass('upfront-region-bg-setting-auto-resize-disabled');
                    $el.removeAttr('title');
                }
                if ( locked ){
                    $status.addClass('auto-resize-off');
                }
                else {
                    $status.addClass('auto-resize-on');
                }
                $el.html('');
                $el.append('<span>' + l10n.auto_resize + '</span>');
                $el.append($status);
            },
            trigger_expand_lock: function ($el) {
                if ( $el.hasClass('upfront-region-bg-setting-auto-resize-disabled') )
                    return;
                var locked = this.model.get_breakpoint_property_value('expand_lock');
                this.model.set_breakpoint_property('expand_lock', !locked);
                this.render_expand_lock($el);
            },
            // Edit CSS trigger
            trigger_edit_css: function () {
                Upfront.Application.cssEditor.init({
                    model: this.model,
                    type: this.model.is_main() ? "RegionContainer" : (this.model.get('type') == 'lightbox')?"RegionLightbox":"Region",
                    element_id: this.model.is_main() ? "region-container-" + this.model.get('name') : "region-" + this.model.get('name')
                });

                this.listenTo(Upfront.Application.cssEditor, 'updateStyles', this.adjust_grid_padding);
            },

            adjust_grid_padding: function() {
                var togglegrid = new Upfront.Views.Editor.Command_ToggleGrid();
                togglegrid.update_grid();
            }
        });

    });
}(jQuery));
