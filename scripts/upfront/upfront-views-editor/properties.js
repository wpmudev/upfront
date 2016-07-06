(function($, Backbone){

    define([
        "scripts/upfront/upfront-views-editor/property",
        "text!upfront/templates/properties.html"
    ], function ( Property, properties_tpl ) {


        return Backbone.View.extend({
            events: {
                "click #add-property": "show_new_property_partial",
                "click #done-adding-property": "add_new_property"
            },
            initialize: function () {
                /*
                 this.model.get("properties").bind("change", this.render, this);
                 this.model.get("properties").bind("add", this.render, this);
                 this.model.get("properties").bind("remove", this.render, this);
                 */

                this.listenTo(this.model.get("properties"), 'change', this.render);
                this.listenTo(this.model.get("properties"), 'add', this.render);
                this.listenTo(this.model.get("properties"), 'remove', this.render);
            },
            render: function () {
                var template = _.template( properties_tpl, this.model.toJSON()),
                    properties = this
                    ;
                this.$el.html(template);
                this.model.get("properties").each(function (obj) {
                    var local_view = new Property({"model": obj});
                    local_view.render();
                    properties.$el.find("dl").append(local_view.el);
                });
            },

            show_new_property_partial: function () {
                this.$("#add-property").hide();
                this.$("#upfront-new_property").slideDown();
            },
            add_new_property: function () {
                var name = this.$("#upfront-new_property-name").val(),
                    value = this.$("#upfront-new_property-value").val()
                    ;
                this.model.get("properties").add(new Upfront.Models.Property({
                    "name": name,
                    "value": value
                }));
                this.$("#upfront-new_property")
                    .slideUp()
                    .find("input").val('').end()
                ;
                this.$("#add-property").show();
            }
        });


    });
}(jQuery, Backbone));