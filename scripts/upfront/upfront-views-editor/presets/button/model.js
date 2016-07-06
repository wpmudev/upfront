(function(Backbone) {

    define([], function() {

        return Backbone.Model.extend({
            initialize: function(attributes) {
                this.set({ presets: attributes });
            }
        });

    });
})(Backbone);