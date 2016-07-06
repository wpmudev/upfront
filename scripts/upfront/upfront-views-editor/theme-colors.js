(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
    ], function () {
        var Theme_Color = Backbone.Model.extend({
            defaults : {
                color : "",
                prev : "",
                highlight : "",
                shade : "",
                selected : "",
                luminance : "",
                alpha: 1
            },
            get_hover_color : function(){
                var self = this;
                if( this.get("selected") !== "" ){
                    return  this.get( self.get("selected") );
                }
                return this.get("color") === '#000000' && this.get("alpha") == 0 ? 'inherit' : this.get("color");
            }
        });

        var Theme_Colors_Collection = Backbone.Collection.extend({
            model : Theme_Color,
            get_colors : function(){
                return this.pluck("color") ? this.pluck("color") : [];
            },
            is_theme_color : function(color){
                color = this.color_to_hex( color );
                return _.indexOf(this.get_colors(), color) !== -1 ? _.indexOf(this.get_colors(), color) + 1 /* <== indexOf can easily return 0 :( */ : false;
            },
            get_css_class : function(color, bg){
                color = this.color_to_hex( color );
                var prefix = _.isUndefined( bg ) || bg === false ? "upfront_theme_color_" : "upfront_theme_bg_color_";
                if( this.is_theme_color(color) ){
                    var model = this.findWhere({
                        color : color
                    });
                    if( model ){
                        var index = this.indexOf( model );
                        return prefix + index;
                    }
                }
                return false;
            },
            get_all_classes : function( bg ){
                var prefix = _.isUndefined( bg ) || bg === false ? "upfront_theme_color_" : "upfront_theme_bg_color_";
                var classes = [];
                _.each( this.get_colors(), function(item, index){
                    classes.push(prefix + index);
                });
                return classes;
            },
            remove_theme_color_classes :  function( $el, bg ){
                _.each(this.get_all_classes( bg ), function(cls){
                    $el.removeClass(cls);
                });
            },
            color_to_hex : function(color) {
                if( typeof tinycolor === "function" ){
                    color = tinycolor(color);
                    return color.toHexString() === '#000000' && color.alpha == 0 ? 'inherit' : color.toHexString();
                }

                if (color.substr(0, 1) === '#') {
                    return color;
                }
                color = color.replace(/\s+/g, '');
                var digits = /(.*?)rgb\((\d+),(\d+),(\d+)\)/.exec(color);
                digits = _.isEmpty(digits) ?  /(.*?)rgba\((\d+),(\d+),(\d+),([0-9.]+)\)/.exec(color) : digits;
                var red = parseInt(digits[2], 10);
                var green = parseInt(digits[3], 10);
                var blue = parseInt(digits[4], 10);

                var rgb = blue | (green << 8) | (red << 16);
                return digits[1] + '#' + rgb.toString(16);
            }
        });

        return {
            colors : new Theme_Colors_Collection(Upfront.mainData.themeColors.colors),
            range  : Upfront.mainData.themeColors.range || 0
        };


    });
}(jQuery));