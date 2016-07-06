(function($, Backbone){
    define([], function () {
        return Backbone.View.extend({
            tagName: 'ul',
            className: 'breakpoints-toggler',
            initialize: function() {
                this.collection = breakpoints_storage.get_breakpoints();

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

}(jQuery, Backbone));