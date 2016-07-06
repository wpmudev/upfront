(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([

    ], function () {
        return Backbone.View.extend({
            "tagName": "div",
            "className": "panel-setting upfront-no-select",
            render: function () {
                if ( this.on_render ) this.on_render();
            }
        });
    });
}(jQuery));