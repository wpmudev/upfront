;(function($){
    define(function(){
    var l10n = Upfront.Settings.l10n.media;
    var INSERT_OPTIONS = {
        uf_insert: 'image_insert',
        wp_insert: 'wp_default'
    };

    var Options_Control = Backbone.View.extend({
        initialize: function(opts){

        },
        render: function(){
            var radios = new Upfront.Views.Editor.Field.Radios({
                label: l10n.insert_options,
                model:  this.model,
                name:  "insert_option",
                layout: 'horizontal-inline',
                default_value: this.model.at(0).get("insert_option") || 'image_insert',
                values: [
                    { label: l10n.image_inserts, value: INSERT_OPTIONS.uf_insert },
                    { label: l10n.wp_default, value: INSERT_OPTIONS.wp_insert }
                ],
                change: function(val){
                    this.model.at(0).set("insert_option", val);
                }
            });
            radios.render();
            this.$el.html( radios.el );

            return  this;
        }
    });

    return {
        Options_Control: Options_Control,
        INSERT_OPTIONS: INSERT_OPTIONS
    };

//End Define
   });
})(jQuery);
