(function($, Backbone){
    define([
        'scripts/upfront/upfront-views-editor/breakpoint'
    ], function ( Breakpoint ) {
        return Backbone.View.extend({
            id: 'upfront-ui-topbar',
            content_views: [],
            initialize: function () {
                this.listenTo(Upfront.Events, 'sidebar:toggle', this.on_sidebar_toggle);
            },
            render: function() {
                _.each(this.content_views, function(view) {
                    view.render();
                    this.$el.append(view.el);
                }, this);

                return this;
            },
            start: function() {
                this.content_views = [];
                if ( Upfront.Application.get_current() === Upfront.Settings.Application.MODE.RESPONSIVE ) {
                    this.content_views.push(new Breakpoint.EditButton());
                    this.content_views.push(new Breakpoint.Toggler());
                }
                $('body').prepend(this.render().el);
            },
            stop: function() {
                this.remove();
            },
            on_sidebar_toggle: function (visible) {
                if ( !visible )
                    this.$el.css('left', 0);
                else
                    this.$el.css('left', '');
            }
        });

    });
}(jQuery, Backbone));