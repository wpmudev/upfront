(function($, Backbone){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([

    ], function () {
        return Backbone.View.extend({
            "tagName": "span",
            "className": "draggable-element upfront-no-select",
            "shadow_id": '',
            "draggable": true,
            "priority": 10000,
            initialize: function(opts){
                this.options = opts;
                this.title = opts.title || l10n.no_title;
            },

            render: function(){
                this.$el.html(this.title);
            },

            add_module: function (module) {
                // Add module to shadow region so it's available to add by dragging
                var region = this.model.get("regions").get_by_name('shadow');
                if (!region || !region.get) return false; // Let's break out if we can't find the shadow region
                this.shadow_id = Upfront.Util.get_unique_id("shadow");
                module.set({"shadow": this.shadow_id}, {silent: true});
                region.get("modules").add(module);
            }
        });

    });
}(jQuery, Backbone));