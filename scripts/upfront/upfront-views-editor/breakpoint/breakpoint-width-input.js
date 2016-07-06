(function($){

    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;

    define([
        'scripts/upfront/upfront-views-editor/breakpoint/storage',
        'scripts/upfront/upfront-views-editor/fields'
    ], function ( storage, Fields) {
        return Backbone.View.extend({
            className: 'breakpoint-width-input',
            initialize: function (options) {
                this.options = options || {};
                this.collection = storage.get_breakpoints();
                this.listenTo(this.collection, 'change:active', this.render);

            },
            render: function () {
                this.$el.html('');
                this.active_breakpoint = this.collection.get_active();
                // Debounce input value change event since it causes some heavy operations to kick in.
                var lazy_propagate_change = _.debounce(this.propagate_change, 1000);

                if (this.active_breakpoint.get('fixed')) return this;

                this.input = new Fields.Number({
                    className: 'inline-number plaintext-settings',
                    min: 1,
                    label: l10n.viewport_width,
                    suffix: l10n.px,
                    default_value: this.active_breakpoint.get('width')
                });

                this.input.render();
                this.$el.html(this.input.el);

                this.listenTo(this.input, 'changed', lazy_propagate_change);

                return this;
            },
            propagate_change: function () {
                this.active_breakpoint.set({'width': this.input.get_value()});
            }
        });

    });
}(jQuery));