(function($){

    define([
        "text!upfront/templates/property.html",
        "text!upfront/templates/property_edit.html"
    ], function ( property_tpl, property_edit_tpl ) {
        return Backbone.View.extend({
            events: {
                "click .upfront-property-change": "show_edit_property_partial",
                "click .upfront-property-save": "save_property",
                "click .upfront-property-remove": "remove_property"
            },
            render: function () {
                var template = _.template( property_tpl, this.model.toJSON());
                this.$el.html(template);
            },

            remove_property: function () {
                this.model.destroy();
            },
            save_property: function () {
                var name = this.$("#upfront-new_property-name").val(),
                    value = this.$("#upfront-new_property-value").val()
                    ;
                this.model.set({
                    "name": name,
                    "value": value
                });
                this.render();
            },
            show_edit_property_partial: function () {
                var template = _.template( property_edit_tpl, this.model.toJSON());
                this.$el.html(template);
            }
        });

    });
}(jQuery));