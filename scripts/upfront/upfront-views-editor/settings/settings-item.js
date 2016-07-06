(function($, Backbone){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
    ], function () {

        return Backbone.View.extend({
            group: true,
            get_name: function () {
                if ( this.fields.length == 1 ) {
                    return this.fields[0].get_name();
                } else if ( this.fields.length > 1 ) {
                    return this.fields.map(function(field){ return field.get_name(); });
                }
            },
            get_value: function () {
                if ( this.fields.length == 1 ) {
                    return this.fields[0].get_value();
                } else if ( this.fields.length > 1 ) {
                    return this.fields.map(function(field){ return field.get_value(); });
                }
            },

            get_title: function () {
                return this.options.title ? this.options.title : '';
            },

            initialize: function (opts) {
                var me = this;
                me.options = opts;
                this.fields = opts.fields ? _(opts.fields) : _([]);
                this.group = typeof opts.group != 'undefined' ? opts.group : this.group;
                this.on('panel:set', function(){
                    me.fields.each(function(field){
                        field.panel = me.panel;
                        field.trigger('panel:set');
                    });
                });
            },

            render: function () {
                if (this.group) {
                    this.$el.append(
                        '<div class="upfront-settings-item">' +
                        '<div class="upfront-settings-item-title"><span>' + this.get_title() + '</span></div>' +
                        '<div class="upfront-settings-item-content"></div>' +
                        '</div>'
                    );
                } else {
                    this.$el.append('<div class="upfront-settings-item-content"></div>');
                }

                var $content = this.$el.find('.upfront-settings-item-content');
                this.fields.each(function(field){
                    field.render();
                    field.delegateEvents();
                    $content.append(field.$el);
                });

                this.trigger('rendered');
            },

            save_fields: function () {
                var changed = _([]);
                this.fields.each(function(field, index, list){
                    if (field.property) {
                        var value = field.get_value() || [];
                        var saved_value = field.get_saved_value();
                        if ( ! field.multiple && value != saved_value ) {
                            changed.push(field);
                        } else if ( field.multiple && (value.length != saved_value.length || _.difference(value, saved_value).length != 0) ) {
                            changed.push(field);
                        }
                    }
                });
                changed.each(function(field, index, list){
                    if ( field.use_breakpoint_property ) {
                        field.model.set_breakpoint_property(field.property_name, field.get_value(), true);
                    } else {
                        field.property.set({'value': field.get_value()}, {'silent': true});
                    }
                });
                if ( changed.size() > 0 ) this.panel.is_changed = true;
            },

            //@TODO remove wrap method below when all elements have changed to use setting fields API
            wrap: function (wrapped) {
                if (!wrapped) return false;
                var title = wrapped.title || '',
                    markup = wrapped.markup || wrapped
                    ;
                this.$el.append(
                    '<div id="usetting-' + this.get_name() + '" class="upfront-settings-item">' +
                    '<div class="upfront-settings-item-title"><span>' + title + '</span></div>' +
                    '<div class="upfront-settings-item-content">' + markup + '</div>' +
                    '</div>'
                );
            },

            remove: function(){
                if(this.fields) {
                    this.fields.each(function(field){
                        field.remove();
                    });
                }
                Backbone.View.prototype.remove.call(this);
            }
        });
    });
}(jQuery, Backbone));