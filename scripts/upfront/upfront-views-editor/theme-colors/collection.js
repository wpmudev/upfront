(function(){

    define([
        'scripts/upfront/upfront-views-editor/theme-colors/model'
    ], function (Model) {

        return Backbone.Collection.extend({
            model : Model,
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

    });
}());