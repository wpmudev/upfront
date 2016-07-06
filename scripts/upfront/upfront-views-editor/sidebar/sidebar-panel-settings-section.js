(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([

    ], function () {
        return Backbone.View.extend({
            "tagName": "div",
            "className": "panel-section",
            initialize: function () {
                this.settings = _([]);
            },
            get_title: function () {},
            render: function () {
                var me = this;
//			this.$el.html('<h4 class="panel-section-title">' + this.get_title() + '</h4>');
                this.$el.html("");
                this.$el.append('<div class="panel-section-content" />');
                this.settings.each(function (setting) {
                    setting.render();
                    setting.delegateEvents();
                    me.$el.find('.panel-section-content').append(setting.el);
                });
                if ( this.on_render ) this.on_render();
            }
        });

    });
}(jQuery));