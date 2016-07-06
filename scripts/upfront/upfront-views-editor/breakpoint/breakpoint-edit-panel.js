(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;

    define([
        'scripts/upfront/upfront-views-editor/breakpoint/storage'
    ], function (storage) {

        return Backbone.View.extend({
            className: 'breakpoint-edit-panel',
            template: '<div><span class="edit-breakpoint-popup-title">' + l10n.set_custom_breakpoint + ':</span></div>' +
            '<div>' +
            '<label for="breakpoint-name">' + l10n.name + ':</label><input type="text" value="{{ name }}" placeholder="' + l10n.custom_breakpoint_placeholder + '" id="breakpoint-name" />' +
            '</div><div>' +
            '<label for="breakpoint-width">' + l10n.width + ':</label><input type="number" min="240" max="1080" value="{{ width }}" id="breakpoint-width" /><label>' + l10n.px + '</label>' +
            '<label for="breakpoint-columns">' + l10n.number_of_columns + ':</label><input min="5" max="24" type="number" value="{{ columns }}" id="breakpoint-columns" />' +
            '</div>',
            events: {
                'change #breakpoint-name': 'on_name_change',
                'change #breakpoint-width': 'on_width_change',
                'change #breakpoint-columns': 'on_columns_change'
            },
            initialize: function(options) {
                this.options = options || {};
                if (_.isUndefined(this.model)) {
                    this.model = storage.get_breakpoints().get_active();
                }

                this.listenTo(this.model, 'change', this.update_values);

                // When changing width to fast there is too much rendering
                this.lazy_change_width = _.debounce(function(width) {
                    this.model.set({ 'width': width });
                }, 500);
            },
            render: function() {
                this.$el.html(_.template(this.template, this.model.toJSON()));

                return this;
            },
            update_values: function() {
                this.$el.find('#breakpoint-name').val(this.model.get('name'));
                this.$el.find('#breakpoint-width').val(this.model.get('width'));
                this.$el.find('#breakpoint-columns').val(this.model.get('columns'));
            },
            on_name_change: function(event) {
                this.model.set({ 'name': $(event.currentTarget).val() });
            },
            on_width_change: function(event) {
                this.lazy_change_width($(event.currentTarget).val());
            },
            on_columns_change: function(event) {
                this.model.set({ 'columns': $(event.currentTarget).val() });
            }
        });

    });
}(jQuery));