(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

        return Command.extend({
            className: "command-logo",
            render: function () {
                var url = Upfront.Settings.site_url;
                if(url[url.length - 1] != '/')
                    url += '/';

                if ( Upfront.Application.get_current() != Upfront.Settings.Application.MODE.CONTENT )
                    this.$el.html('<a class="upfront-logo" href="' + url + '"></a>');
                else
                    this.$el.html('<a class="upfront-logo upfront-logo-small" href="' + url + '"></a>');
            },
            on_click: function () {
                if(_upfront_post_data) _upfront_post_data.post_id = false;
                Upfront.Events.trigger('click:edit:navigate', false);
                /*var root = Upfront.Settings.site_url;
                 root = root[root.length - 1] == '/' ? root : root + '/';

                 if(window.location.origin + window.location.pathname != root)
                 Upfront.Application.navigate('/' + root.replace(window.location.origin, '') + window.location.search, {trigger: true});*/
            }
        });

    });
}(jQuery));