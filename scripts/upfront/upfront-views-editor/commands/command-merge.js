(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            render: function () {
                if (!this.model.merge.length) return false;
                this.$el.html(l10n.merge_selected);
            },
            on_click: function () {
                var merge_models = this.model.merge,
                    region = this.model.get("regions").active_region,
                    collection = region.get("modules"),
                    objects = []
                    ;
                _(merge_models).each(function (module) {
                    module.get("objects").each(function (obj) {
                        objects.push(obj);
                    });
                    collection.remove(module);
                });
                var module_id = Upfront.Util.get_unique_id("module"),
                    module = new Upfront.Models.Module({
                        "name": "Merged module",
                        "properties": [
                            {"name": "element_id", "value": module_id},
                            {"name": "class", "value": "c24"}
                        ],
                        "objects": objects
                    });
                this.add_module(module);
                $("#" + module_id).trigger("click"); // Reset selectable and activate the module
                this.remove();
                this.trigger("upfront:command:remove", this);
                Upfront.Events.trigger("command:merge");
            }
        });

    });
}(jQuery));