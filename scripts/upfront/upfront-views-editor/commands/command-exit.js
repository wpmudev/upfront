(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            className: "command-exit upfront-icon upfront-icon-exit",
            render: function () {
                this.stopListening(Upfront.Events, 'stay:upfront:editor');
                this.listenTo(Upfront.Events, 'stay:upfront:editor', this.stayed);
            },
            on_click: function () {
                // Upfront.Events.trigger("command:exit");
                var url = window.location.pathname,
                    loading = new Upfront.Views.Editor.Loading({
                        loading: l10n.exiting_upfront,
                        done: l10n.exit_done,
                        fixed: true
                    })
                    ;

                loading.render();
                $('body').append(loading.$el);

                // will be cleared when User chooses to stay
                this.tmout = setTimeout(function () {
                    loading.cancel();
                }, 1000);

                if (url.indexOf('/create_new/') !== -1) {
                    return (window.location.href = Upfront.Settings.site_url);
                }
                if (url.indexOf('/edit/') !== -1 && _upfront_post_data && _upfront_post_data.post_id) {
                    return (window.location.href = Upfront.Settings.site_url + '/?p=' + _upfront_post_data.post_id);
                }
                if (window.location.search.match(/(\?|\&)editmode/)) {
                    return (window.location.search = window.location.search.replace(/(\?|\&)editmode(=[^?&]+)?/, ''));
                }

                window.location.reload(true);

            },
            stayed: function () {
                clearTimeout(this.tmout);
            }
        });

    });
}(jQuery));