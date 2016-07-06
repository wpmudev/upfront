(function(){

    define([
        'scripts/upfront/upfront-views-editor/theme-colors/collection'
    ], function (Collection) {

        return {
            colors : new Collection(Upfront.mainData.themeColors.colors),
            range  : Upfront.mainData.themeColors.range || 0
        };

    });
}());