(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        "scripts/upfront/upfront-views-editor/mixins",
        "scripts/upfront/upfront-views-editor/settings/settings-item",
        "scripts/upfront/upfront-views-editor/fields"
    ], function (Mixins, SettingsItem, Fields) {

        var _Settings_CSS = SettingsItem.extend({
            className: 'upfront-settings-css',
            events: {
                'click .upfront-css-edit': 'openEditor'
            },
            initialize: function(options) {
                SettingsItem.prototype.initialize.call(this, options);
                if (!Upfront.Application.cssEditor) return false;

                var styleType = Upfront.Application.cssEditor.getElementType(this.model),
                    values = [{label: l10n.default_str, value: '_default'}];

                if (Upfront.data.styles[styleType.id]) {
                    _.each(Upfront.data.styles[styleType.id], function(styleName){
                        if (styleName.indexOf('_default') > -1) return;
                        values.push({label: styleName, value: styleName});
                    });
                }

                this.fields = _([
                    new Upfront.Views.Editor.Field.Button({
                        model: this.model,
                        className: 'edit-preset-css-label',
                        compact: true,
                        label: l10n.edit_css_label
                    }),

                    new Upfront.Views.Editor.Field.Button({
                        model: this.model,
                        className: 'upfront-css-edit upfront-small-button',
                        compact: true,
                        name: 'preset_css',
                        label: l10n.edit_css
                    })
                ]);
            },

            openEditor: function(e){
                e.preventDefault();

                Upfront.Events.trigger("entity:settings:beforedeactivate");

                Upfront.Application.cssEditor.init({
                    model: this.model,
                    stylename: '_default' // Let's make sure we have *something* to work with
                });

                Upfront.Events.trigger("entity:settings:deactivate");

                //$('#settings').find('.upfront-save_settings').click();
            }
        });

        var _Settings_Padding = SettingsItem.extend({
            className: 'upfront-settings-padding',
            initialize: function(options) {
                var column_padding = Upfront.Settings.LayoutEditor.Grid.column_padding,
                    is_group = this.model instanceof Upfront.Models.ModuleGroup,
                    top_padding_use = new Fields.Checkboxes({
                        model: this.model,
                        use_breakpoint_property: true,
                        property: 'top_padding_use',
                        label: '',
                        multiple: false,
                        values: [{ label: l10n.top_padding, value: 'yes' }],
                        default_value: this.model.get_breakpoint_property_value('top_padding_use') || false,
                        change: function () {
                            var value = this.get_value();

                            this.model.set_breakpoint_property('top_padding_use', value ? value : 0);
                        },
                        show: function (value, $el) {
                            if(value === 'yes') {
                                $(top_padding_slider.$el).css('display', 'inline-block');
                                $(top_padding_num.$el).css('display', 'inline-block');
                            }
                            else {
                                $(top_padding_slider.$el).hide();
                                $(top_padding_num.$el).hide();
                            }
                        }
                    }),
                    top_padding_slider = new Fields.Slider({
                        model: this.model,
                        use_breakpoint_property: true,
                        property: 'top_padding_slider',
                        label: '',
                        default_value: this.model.get_breakpoint_property_value('top_padding_slider') || column_padding,
                        min: 0,
                        max: 200,
                        step: 5,
                        valueTextFilter: function () {return '';},
                        change: function () {
                            var value = this.get_value();

                            this.model.set_breakpoint_property('top_padding_slider', value);
                            top_padding_num.get_field().val(value);
                            this.model.set_breakpoint_property('top_padding_num', value, true);
                        }
                    }),
                    top_padding_num = new Fields.Number({
                        model: this.model,
                        use_breakpoint_property: true,
                        property: 'top_padding_num',
                        label: '',
                        default_value: this.model.get_breakpoint_property_value('top_padding_num') || column_padding,
                        suffix: l10n.px,
                        min: 0,
                        step: 5,
                        change: function () {
                            var value = this.get_value();

                            this.model.set_breakpoint_property('top_padding_num', value);
                            this.model.set_breakpoint_property('top_padding_slider', value, true);
                            top_padding_slider.$el.find('#'+top_padding_slider.get_field_id()).slider('value', value);
                        }
                    }),
                    bottom_padding_use = new Fields.Checkboxes({
                        model: this.model,
                        use_breakpoint_property: true,
                        property: 'bottom_padding_use',
                        label: '',
                        multiple: false,
                        values: [{ label: l10n.bottom_padding, value: 'yes' }],
                        default_value: this.model.get_breakpoint_property_value('bottom_padding_use') || false,
                        change: function () {
                            var value = this.get_value();

                            this.model.set_breakpoint_property('bottom_padding_use', value ? value : 0);
                        },
                        show: function (value, $el) {
                            if(value === 'yes') {
                                $(bottom_padding_slider.$el).css('display', 'inline-block');
                                $(bottom_padding_num.$el).css('display', 'inline-block');
                            }
                            else {
                                $(bottom_padding_slider.$el).hide();
                                $(bottom_padding_num.$el).hide();
                            }
                        }
                    }),
                    bottom_padding_slider = new Fields.Slider({
                        model: this.model,
                        use_breakpoint_property: true,
                        property: 'bottom_padding_slider',
                        label: '',
                        default_value: this.model.get_breakpoint_property_value('bottom_padding_slider') || column_padding,
                        min: 0,
                        max: 200,
                        step: 5,
                        valueTextFilter: function () {return '';},
                        change: function () {
                            var value = this.get_value();

                            this.model.set_breakpoint_property('bottom_padding_slider', value);
                            bottom_padding_num.get_field().val(value);
                            this.model.set_breakpoint_property('bottom_padding_num', value, true);
                        }
                    }),
                    bottom_padding_num = new Fields.Number({
                        model: this.model,
                        use_breakpoint_property: true,
                        property: 'bottom_padding_num',
                        label: '',
                        default_value: this.model.get_breakpoint_property_value('bottom_padding_num') || column_padding,
                        suffix: l10n.px,
                        min: 0,
                        step: 5,
                        change: function () {
                            var value = this.get_value();

                            this.model.set_breakpoint_property('bottom_padding_num', value);
                            this.model.set_breakpoint_property('bottom_padding_slider', value, true);
                            bottom_padding_slider.$el.find('#'+bottom_padding_slider.get_field_id()).slider('value', value);
                        }
                    })
                    ;
                if ( !is_group ) {
                    var	left_padding_use = new Fields.Checkboxes({
                            model: this.model,
                            use_breakpoint_property: true,
                            property: 'left_padding_use',
                            label: '',
                            multiple: false,
                            values: [{ label: l10n.left_padding, value: 'yes' }],
                            default_value: this.model.get_breakpoint_property_value('left_padding_use') || false,
                            change: function () {
                                var value = this.get_value();

                                this.model.set_breakpoint_property('left_padding_use', value ? value : 0);
                            },
                            show: function (value, $el) {
                                if(value === 'yes') {
                                    $(left_padding_slider.$el).css('display', 'inline-block');
                                    $(left_padding_num.$el).css('display', 'inline-block');
                                }
                                else {
                                    $(left_padding_slider.$el).hide();
                                    $(left_padding_num.$el).hide();
                                }
                            }
                        }),
                        left_padding_slider = new Fields.Slider({
                            model: this.model,
                            use_breakpoint_property: true,
                            property: 'left_padding_slider',
                            label: '',
                            default_value: this.model.get_breakpoint_property_value('left_padding_slider') || column_padding,
                            min: 0,
                            max: 200,
                            step: 5,
                            valueTextFilter: function () {return '';},
                            change: function () {
                                var value = this.get_value();

                                this.model.set_breakpoint_property('left_padding_slider', value);
                                left_padding_num.get_field().val(value);
                                this.model.set_breakpoint_property('left_padding_num', value, true);
                            }
                        }),
                        left_padding_num = new Fields.Number({
                            model: this.model,
                            use_breakpoint_property: true,
                            property: 'left_padding_num',
                            label: '',
                            default_value: this.model.get_breakpoint_property_value('left_padding_num') || column_padding,
                            suffix: l10n.px,
                            min: 0,
                            step: 5,
                            change: function () {
                                var value = this.get_value();

                                this.model.set_breakpoint_property('left_padding_num', value);
                                this.model.set_breakpoint_property('left_padding_slider', value, true);
                                left_padding_slider.$el.find('#'+left_padding_slider.get_field_id()).slider('value', value);
                            }
                        }),
                        right_padding_use = new Fields.Checkboxes({
                            model: this.model,
                            use_breakpoint_property: true,
                            property: 'right_padding_use',
                            label: '',
                            multiple: false,
                            values: [{ label: l10n.right_padding, value: 'yes' }],
                            default_value: this.model.get_breakpoint_property_value('right_padding_use') || false,
                            change: function () {
                                var value = this.get_value();

                                this.model.set_breakpoint_property('right_padding_use', value ? value : 0);
                            },
                            show: function (value, $el) {
                                if(value === 'yes') {
                                    $(right_padding_slider.$el).css('display', 'inline-block');
                                    $(right_padding_num.$el).css('display', 'inline-block');
                                }
                                else {
                                    $(right_padding_slider.$el).hide();
                                    $(right_padding_num.$el).hide();
                                }
                            }
                        }),
                        right_padding_slider = new Fields.Slider({
                            model: this.model,
                            use_breakpoint_property: true,
                            property: 'right_padding_slider',
                            label: '',
                            default_value: this.model.get_breakpoint_property_value('right_padding_slider') || column_padding,
                            min: 0,
                            max: 200,
                            step: 5,
                            valueTextFilter: function () {return '';},
                            change: function () {
                                var value = this.get_value();

                                this.model.set_breakpoint_property('right_padding_slider', value);
                                right_padding_num.get_field().val(value);
                                this.model.set_breakpoint_property('right_padding_num', value, true);
                            }
                        }),
                        right_padding_num = new Fields.Number({
                            model: this.model,
                            use_breakpoint_property: true,
                            property: 'right_padding_num',
                            label: '',
                            default_value: this.model.get_breakpoint_property_value('right_padding_num') || column_padding,
                            suffix: l10n.px,
                            min: 0,
                            step: 5,
                            change: function () {
                                var value = this.get_value();

                                this.model.set_breakpoint_property('right_padding_num', value);
                                this.model.set_breakpoint_property('right_padding_slider', value, true);
                                right_padding_slider.$el.find('#'+right_padding_slider.get_field_id()).slider('value', value);
                            }
                        })
                        ;
                }

                SettingsItem.prototype.initialize.call(this, options);

                if ( !is_group ){
                    this.fields = _([
                        top_padding_use,
                        top_padding_slider,
                        top_padding_num,
                        bottom_padding_use,
                        bottom_padding_slider,
                        bottom_padding_num,
                        left_padding_use,
                        left_padding_slider,
                        left_padding_num,
                        right_padding_use,
                        right_padding_slider,
                        right_padding_num
                    ]);
                }
                else {
                    this.fields = _([
                        top_padding_use,
                        top_padding_slider,
                        top_padding_num,
                        bottom_padding_use,
                        bottom_padding_slider,
                        bottom_padding_num
                    ]);
                }
            }
        });

        var _Settings_AnchorSetting = SettingsItem.extend({
            className: "upfront-settings-item-anchor",
            //group: false,
            initialize: function (opts) {
                this.options = opts;
                SettingsItem.prototype.initialize.call(this, this.options);
                var item = new Fields.Field_Complex_Toggleable_Text_Field({
                    element_label: l10n.make_element_anchor,
                    className: 'upfront-field-complex_field-boolean_toggleable_text upfront-field-multiple checkbox-title',
                    model: this.model,
                    property: 'anchor'
                });
                item.on("anchor:updated", function () {
                    this.trigger("anchor:item:updated");
                }, this);
                this.fields = _([item]);
            },
            save_fields: function () {
                this.fields.invoke("check_value");
                SettingsItem.prototype.save_fields.call(this);
            }
        });

        var _Panel = Backbone.View.extend(_.extend({}, Mixins.Upfront_Scroll_Mixin, {
            className: 'upfront-settings_panel_wrap',
            // For Anchor & Styles settings
            hide_common_anchors: false,
            hide_common_fields: false,

            events: {
                "click .upfront-save_settings": "on_save",
                "click .upfront-cancel_settings": "on_cancel",
                "click .upfront-settings_label": "on_toggle",
                "click .upfront-settings-common_panel .upfront-settings-item-title": "on_toggle_common",
                "click .upfront-settings-padding_panel .upfront-settings-item-title": "on_toggle_padding"
            },

            get_title: function () {
                return this.options.title ? this.options.title : '';
            },

            get_label: function () {
                return this.options.label ? this.options.label : '';
            },

            initialize: function (options) {
                var me = this;
                this.hide_common_fields = _.isUndefined(options.hide_common_fields) ? false : options.hide_common_fields;
                this.hide_common_anchors = _.isUndefined(options.hide_common_anchors) ? false : options.hide_common_anchors;
                me.options = options;
                this.settings = options.settings ? _(options.settings) : _([]);
                this.settings.each(function(setting){
                    setting.panel = me;
                    setting.trigger('panel:set');
                });
                this.tabbed = ( typeof options.tabbed != 'undefined' ) ? options.tabbed : this.tabbed;
            },

            tabbed: false,
            is_changed: false,

            render: function () {
                this.$el.html('<div class="upfront-settings_label" /><div class="upfront-settings_panel" ><div class="upfront-settings_panel_scroll" />');

                var $label = this.$el.find(".upfront-settings_label"),
                    $panel = this.$el.find(".upfront-settings_panel"),
                    $panel_scroll = this.$el.find(".upfront-settings_panel_scroll"),
                    $common_panel,
                    me = this
                    ;

                $label.append(this.get_label());
                this.settings.each(function (setting) {
                    if ( ! setting.panel ) {
                        setting.panel = me;
                    }
                    setting.render();
                    $panel_scroll.append(setting.el);
                });
                if ( this.options.min_height ) {
                    $panel_scroll.css('min-height', this.options.min_height);
                }
                if ( this.tabbed ) {
                    var first_tab = this.settings.first();
                    if ( !first_tab.radio ) {
                        first_tab.reveal();
                    }
                    $panel_scroll.append('<div class="upfront-settings-tab-height" />');
                }
                this.stop_scroll_propagation($panel_scroll);
                // Add common fields
                if (this.hide_common_fields === false) {
                    this.$el.find('.upfront-settings_panel_scroll').after('<div class="upfront-settings-common_panel"></div>');
                    $common_panel = this.$el.find(".upfront-settings-common_panel");
                    // Let's disable CSS settings panel as this is not used anymore
                    /*if (typeof this.cssEditor == 'undefined' || this.cssEditor) {
                     // Adding CSS item
                     var css_settings = new _Settings_CSS({
                     model: this.model,
                     title: (false === this.hide_common_anchors ? l10n.css_and_anchor : l10n.css_styles)
                     });
                     css_settings.panel = me;
                     css_settings.render();
                     $common_panel.append(css_settings.el);
                     }*/
                    // Adding anchor trigger
                    //todo should add this check again// if (this.options.anchor && this.options.anchor.is_target) {

                    if (this.hide_common_anchors === false) {
                        var anchor_settings = new _Settings_AnchorSetting({
                            model: this.model,
                            title: l10n.anchor_settings
                        });
                        anchor_settings.panel = me;
                        anchor_settings.render();
                        $common_panel.append(anchor_settings.el);
                    }

                    // this.listenTo(anchor_settings, "anchor:item:updated", function () {
                    // this.toggle_panel(first); //todo don't know what this was for should investigate
                    // });
                }
                // Padding panel
                this.$el.find('.upfront-settings_panel_scroll').after('<div class="upfront-settings-padding_panel"></div>');
                $padding_panel = this.$el.find(".upfront-settings-padding_panel");
                if(typeof this.paddingEditor == 'undefined' || this.paddingEditor){
                    // Adding Padding item
                    this.paddingEditor = new _Settings_Padding({
                        model: this.model,
                        title: l10n.padding_settings
                    });
                    this.paddingEditor.panel = me;
                    this.paddingEditor.render();
                    $padding_panel.append(this.paddingEditor.el);
                }
                // Save button
                $panel.append(
                    "<div class='upfront-settings-button_panel'>" +
                    "<button type='button' class='upfront-save_settings sidebar-commands-button blue'><i class='icon-ok'></i> " + l10n.ok + "</button>" +
                    '</div>'
                );

                this.$el.fadeIn('fast', function() {
                    // Scroll the window if settings box clips vertically
                    var parent = me.$el.parent();
                    var elementbottom = (parent.offset() ? parent.offset().top : 0) + parent.height();
                    var winheight = jQuery(window).height();

                    if( (elementbottom +60) > (winheight+jQuery('body').scrollTop())) {
                        jQuery('body').animate({scrollTop:(elementbottom - winheight + 60)}, 'slow');
                    }

                });
                this.trigger('rendered');
            },

            on_toggle_common: function () {
                var me = this;
                var panel = this.$el.find('.upfront-settings-common_panel');
                panel.toggleClass('open');
                /*if(panel.is('.open')) {
                 this.$el.find('.upfront-settings-common_panel .upfront-settings-item-title span').first().html(l10n.element_css_styles);
                 } else {
                 this.$el.find('.upfront-settings-common_panel .upfront-settings-item-title span').first().html(
                 (false === me.hide_common_anchors ? l10n.css_and_anchor : l10n.css_styles)
                 );
                 }*/
            },

            on_toggle_padding: function () {
                var me = this;
                var panel = this.$el.find('.upfront-settings-padding_panel');
                panel.toggleClass('open');
            },

            conceal: function () {
                this.$el.find(".upfront-settings_panel").hide();
                this.$el.find(".upfront-settings_label").removeClass("active");
                //this.$el.find(".upfront-settings_label").show();
                this.trigger('concealed');
            },

            reveal: function () {
                this.$el.find(".upfront-settings_label").addClass("active");
                //this.$el.find(".upfront-settings_label").hide();
                this.$el.find(".upfront-settings_panel").show();
                if ( this.tabbed ) {
                    var tab_height = 0;
                    this.$el.find('.upfront-settings-item-tab-content').each(function(){
                        var h = $(this).outerHeight(true);
                        tab_height = h > tab_height ? h : tab_height;
                    });
                    this.$el.find('.upfront-settings-tab-height').css('height', tab_height);
                }
                this.trigger('revealed');
            },

            show: function () {
                this.$el.show();
            },

            hide: function () {
                this.$el.hide();
            },

            is_active: function () {
                return this.$el.find(".upfront-settings_panel").is(":visible");
            },

            on_toggle: function () {
                this.trigger("upfront:settings:panel:toggle", this);
                this.show();
            },
            //@Furqan and this for Loading for pnaels
            start_loading: function (loading_message, loading_complete_message) {
                this.loading = new Upfront.Views.Editor.Loading({
                    loading: loading_message,
                    done: loading_complete_message
                });
                this.loading.render();
                this.$el.find(".upfront-settings_panel").append(this.loading.$el);
            },
            end_loading: function (callback) {
                if ( this.loading ) {
                    this.loading.done(callback);
                } else {
                    callback();
                }
            },
            //end
            on_save: function () {
                var any_panel_changed = false;
                this.parent_view.panels.each(function(panel){
                    panel.save_settings();
                    if ( panel.is_changed ) {
                        any_panel_changed = true;
                        panel.is_changed = false;
                    }
                });
                if ( any_panel_changed ) {
                    this.parent_view.model.get("properties").trigger('change');
                }
                this.trigger("upfront:settings:panel:saved", this);
                Upfront.Events.trigger("entity:settings:deactivate");
            },
            save_settings: function () {
                if (!this.settings) return false;

                var me = this;
                this.settings.each(function (setting) {
                    if ( (setting.fields || setting.settings).size() > 0 ) {
                        setting.save_fields();
                    } else {
                        var value = me.model.get_property_value_by_name(setting.get_name());
                        if ( value != setting.get_value() ) {
                            me.model.set_property(
                                setting.get_name(),
                                setting.get_value()
                            );
                        }
                    }
                });
                Upfront.Events.trigger("entity:settings:saved");
            },

            on_cancel: function () {
                this.trigger("upfront:settings:panel:close", this);
            },
            remove: function(){
                if (this.settings) {
                    this.settings.each(function(setting){
                        setting.remove();
                    });
                }
                this.$el.off();
                Backbone.View.prototype.remove.call(this);
            }

        }));

		return {
			Settings_CSS: _Settings_CSS,
			Panel: _Panel,
			AnchorSetting: _Settings_AnchorSetting
		};
    });
})(jQuery);
