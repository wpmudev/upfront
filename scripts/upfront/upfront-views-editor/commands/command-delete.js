(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            initialize: function () {
                Upfront.Events.on("entity:activated", this.activate, this);
                Upfront.Events.on("entity:deactivated", this.deactivate, this);
                this.deactivate();
            },
            render: function () {
                this.$el.html(l10n.delete_string);
            },

            on_click: function () {
                var region = this.model.get("regions").active_region,
                    modules = region.get("modules"),
                    active_module = modules.active_entity
                    ;
                if (active_module) return this.delete_module(region, active_module);

                modules.each(function (module) {
                    var objects = module.get("objects"),
                        active_object = objects.active_entity
                        ;
                    if (active_object) objects.remove(active_object);
                });
            },

            activate: function () {
                this.$el.css("text-decoration", "none");
            },
            deactivate: function () {
                this.$el.css("text-decoration", "line-through");
            },

            delete_module: function (region, module) {
                var modules = region.get("modules");
                modules.remove(module);
            }
        });

    });
}(jQuery));