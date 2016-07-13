(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command-toggle-mode'
    ], function ( Command_ToggleMode ) {

        return Command_ToggleMode.extend({
            className: 'command-toggle-mode upfront-icon',
            current_mode: false,
            render: function () {
                if ( this.current_mode )
                    this.$el.removeClass('command-toggle-mode-' + this.current_mode + ' upfront-icon-collapse upfront-icon-expand');
                this.current_mode = Upfront.Application.get_current();
                var icon = ( this.current_mode != Upfront.Application.MODE.CONTENT ) ? 'upfront-icon-collapse' : 'upfront-icon-expand';
                this.$el.addClass('command-toggle-mode-' + this.current_mode + ' ' + icon);
            }
        });

    });
}(jQuery));