(function($){

    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;

    define([
        'scripts/upfront/upfront-views-editor/breakpoint/storage',
        'scripts/upfront/upfront-views-editor/breakpoint/breakpoint-activate-button'
    ], function ( storage, Breakpoint_Activate_Button ) {
        return Backbone.View.extend({
            tagName: 'ul',
            className: 'breakpoints-toggler',
            initialize: function() {
                this.collection = storage.get_breakpoints();

                this.listenTo(this.collection, 'add remove change', this.render);
            },
            render: function() {
                this.$el.html('');
                _.each(this.collection.sorted_by_width(), function(breakpoint) {
                    // Add only enabled breakpoints
                    if (breakpoint.get('enabled') === false) return;

                    var breakpoint_button = new Breakpoint_Activate_Button({ model: breakpoint});
                    this.$el.append(breakpoint_button.render().el);
                }, this);
                return this;
            }
        });

    });

}(jQuery));