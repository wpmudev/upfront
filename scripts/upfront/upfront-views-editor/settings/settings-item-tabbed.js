(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        "scripts/upfront/upfront-views-editor/mixins"
    ], function (Mixins) {

        return Backbone.View.extend(_.extend({}, Mixins.Upfront_Icon_Mixin, {
            className: 'upfront-settings-item-tab-wrap',
            radio: false,
            is_default: false,
            events: {
                "click .upfront-settings-item-tab": "reveal"
            },
            initialize: function (opts) {
                this.options = opts;
                this.settings = opts.settings ? _(opts.settings) : _([]);
                this.radio = ( typeof opts.radio != 'undefined' ) ? opts.radio : this.radio;
                this.is_default = ( typeof opts.is_default != 'undefined' ) ? opts.is_default : this.is_default;
            },
            get_title: function () {
                return this.options.title ? this.options.title : '';
            },
            get_icon: function () {
                return this.options.icon ? this.options.icon : '';
            },
            get_property: function () {
                return this.options.property ? this.options.property : '';
            },
            get_value: function () {
                return this.options.value ? this.options.value : '';
            },
            get_property_model: function () {
                var property = this.get_property();
                if ( !property ) return false;
                return this.model.get_property_by_name(property);
            },
            get_property_value: function () {
                var property_model = this.get_property_model();
                return property_model ? property_model.get('value') : '';
            },
            render: function () {
                var me = this;
                this.$el.html('');
                this.$el.append('<div class="upfront-settings-item-tab" />');
                this.$el.append('<div class="upfront-settings-item-tab-content" />');
                var $tab = this.$el.find('.upfront-settings-item-tab'),
                    $tab_content = this.$el.find('.upfront-settings-item-tab-content');
                if ( this.radio ) {
                    var property_model = this.get_property_model();
                    if ( ! property_model ) {
                        if ( this.is_default ) this.model.init_property(this.get_property(), this.get_value());
                    }
                    var id = this.cid + '-' + this.get_property();
                    var $label = $('<label for="' + id + '" />');
                    var checked = ( this.get_property_value() == this.get_value() );
                    $label.append(this.get_icon_html(this.get_icon()));
                    $label.append('<span class="upfront-settings-item-tab-radio-text">' + this.get_title() + '</span>');
                    $tab.append($label);
                    $tab.append('<input type="radio" id="' + id + '" class="upfront-field-radio" name="' + this.get_property() + '" value="' + this.get_value() + '" ' + ( checked ? 'checked="checked"' : '' ) +  ' />');
                    this.$el.addClass('upfront-settings-item-tab-radio');
                } else {
                    $tab.text(this.get_title());
                }
                this.settings.each(function(setting){
                    setting.panel = me.panel;
                    setting.render();
                    $tab_content.append(setting.el);
                });
                //this.panel.on('rendered', this.panel_rendered, this);
                this.listenTo(this.panel, 'rendered', this.panel_rendered);

                this.trigger('rendered');
            },
            conceal: function () {
                this.$el.removeClass('upfront-settings-item-tab-active');
            },
            reveal: function () {
                this.panel.settings.invoke('conceal');
                this.$el.addClass('upfront-settings-item-tab-active');
                if ( this.radio ) {
                    this.$el.find('.upfront-settings-item-tab input').prop('checked', true).trigger('change');
                }
            },
            panel_rendered: function () {
                if ( this.radio && (this.get_property_value() == this.get_value()) ) {
                    this.reveal();
                }
            },
            save_fields: function () {
                this.settings.invoke('save_fields');
                if ( this.radio && this.$el.find('.upfront-settings-item-tab input:checked').size() > 0 ) {
                    var property_model = this.get_property_model();
                    if ( property_model ) {
                        property_model.set({'value': this.get_value()}, {silent: true});
                    } else {
                        this.model.init_property(this.get_property(), this.get_value());
                    }
                    if ( this.get_property_value() != this.get_value() ) {
                        this.panel.is_changed = true;
                    }
                }
            },
            remove: function(){
                if(this.settings) {
                    this.settings.each(function(setting){
                        setting.remove();
                    });
                }
                Backbone.View.prototype.remove.call(this);
            }
        }));
    });
}(jQuery));