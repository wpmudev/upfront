(function(Backbone){

    define([], function () {

        return Backbone.Model.extend({
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

    });
}(Backbone));