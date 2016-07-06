(function($, Backbone){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
    ], function () {
        return Backbone.View.extend({
            "tagName": "li",
            "events": {
                "click": "on_click"
            },
            on_click: function () { this.render(); },
            add_module: function (module) {
                var region = this.model.get("regions").active_region;
                if (!region) return Upfront.Util.log("select a region");
                Upfront.Events.trigger("entity:module:before_added", module, region);
                var wrappers = this.model.get('wrappers'),
                    wrapper_id = Upfront.Util.get_unique_id("wrapper"),
                    wrapper = new Upfront.Models.Wrapper({
                        "name": "",
                        "properties": [
                            {"name": "wrapper_id", "value": wrapper_id},
                            {"name": "class", "value": "c24 clr"}
                        ]
                    });
                module.set_property('wrapper_id', wrapper_id);
                wrappers.add(wrapper);
                region.get("modules").add(module);
                Upfront.Events.trigger("entity:module:added", module, region);
            }
        });
    });
}(jQuery, Backbone));