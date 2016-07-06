(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        "scripts/upfront/upfront-views-editor/css/css-editor",
        "scripts/upfront/upfront-views-editor/css/general-css-editor"
    ], function ( CSSEditor, GeneralCSSEditor) {
        return {
            CSSEditor: CSSEditor,
            GeneralCSSEditor: GeneralCSSEditor
        };
    });
}(jQuery));