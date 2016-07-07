(function(){

    define([
        'scripts/upfront/upfront-views-editor/mixins/upfront-icon-mixin',
        'scripts/upfront/upfront-views-editor/mixins/upfront-scroll-mixin'
    ], function ( Upfront_Icon_Mixin, Upfront_Scroll_Mixin ) {


        return {
            Upfront_Scroll_Mixin: Upfront_Scroll_Mixin,
            Upfront_Icon_Mixin: Upfront_Icon_Mixin
        };

    });
}());