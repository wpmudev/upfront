(function($){

    define([
        'scripts/upfront/upfront-views-editor/breakpoint/collection'
    ], function (Collection) {

        /**
         * Wrapper for Breakpoints_Collection since we can't use Backbone.Collection
         * native saving.
         */
        var Breakpoints_Storage = function (stored_breakpoints) {
            var breakpoints;

            var initialize = function () {
                breakpoints = new Collection(stored_breakpoints);
                var default_breakpoint = breakpoints.get_default();
                default_breakpoint.set({'active': true});

                breakpoints.on('change:enabled change:width change:name add remove change:typography change:styles', save_breakpoints);

                // This should go somewhere else, just a temp
                _.each(breakpoints.models, function (breakpoint) {
                    var $style = $('#' + breakpoint.get('id') + '-breakpoint-style');

                    if ($style.length > 0) return;

                    $('body').append('<style id="' + breakpoint.get('id') + '-breakpoint-style">' +
                        breakpoint.get('styles') +
                        '</style>'
                    );
                });
            };

            this.get_breakpoints = function () {
                return breakpoints;
            };

            var save_breakpoints = function () {
                var postData = {
                    action: 'upfront_update_breakpoints',
                    breakpoints: breakpoints.toJSON()
                };

                Upfront.Util.post(postData)
                    .error(function () {
                        return notifier.addMessage(l10n.breakpoint_save_fail);
                    });
            };

            Upfront.Events.once("application:mode:before_switch", initialize);
        };

        return new Breakpoints_Storage(Upfront.mainData.themeInfo.breakpoints);


    });

}(jQuery));