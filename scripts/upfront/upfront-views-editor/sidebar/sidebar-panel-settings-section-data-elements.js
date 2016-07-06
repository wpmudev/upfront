(function($, Backbone){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([

    ], function () {
        return SidebarPanel_Settings_Section_LayoutElements.extend({
            get_name: function () {
                return 'data';
            },
            get_title: function () {
                return "Data";
            }
        });


    });
}(jQuery, Backbone));