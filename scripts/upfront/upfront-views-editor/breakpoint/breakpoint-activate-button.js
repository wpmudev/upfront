(function($, Backbone){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([], function () {

        /**
         * Activates breakpoint which will change layout size.
         */
        return Backbone.View.extend({
            tagName: 'li',
            template: '{{ short_name }} ({{ width }}px)',
            className: function () {
                return this.model.get('id') + '-breakpoint-activate';
            },
            events: {
                'click': 'on_click'
            },
            initialize: function (options) {
                this.options = options || {};
            },
            render: function () {
                this.$el.html(_.template(this.template, this.model.toJSON()));
                if (this.model.get('active')) this.$el.addClass('active');
                return this;
            },
            on_click: function () {
                this.model.set({'active': true});
                // hide all Edit Region for responsive
                // Edit Region will show on mouseenter
                $('.upfront-region-edit-trigger-small').removeClass('visible');
            }
        });
    });

}(jQuery, Backbone));