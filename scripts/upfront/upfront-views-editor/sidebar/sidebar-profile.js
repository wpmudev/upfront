(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([

    ], function () {
        return Backbone.View.extend({
            className: "sidebar-profile",
            render: function () {
                var user = Upfront.data.currentUser;
                if ( !user ) user = new Backbone.Model();
                var data = user.get('data') || {},
                    roles = user.get('roles') || [],
                    tpl
                    ;
                tpl = '<div class="sidebar-profile-avatar"><img src="//www.gravatar.com/avatar/{{ gravatar ? gravatar : "gravatar" }}?s=25" /></div>' +
                    '<div class="sidebar-profile-detail"><span class="sidebar-profile-name">{{name}}</span><span class="sidebar-profile-role">{{role}}</span></div>' +
                    (roles.length ? '<div class="sidebar-profile-edit"><a class="upfront-icon upfront-icon-edit" data-bypass="true" title="'+  l10n.edit_profile +'" href="{{edit_url}}">' + l10n.edit_profile + '</a></div>' : '');
                this.$el.html(_.template(tpl,
                    {
                        gravatar: data.gravatar,
                        name: data.display_name || l10n.anonymous,
                        role: roles[0] || l10n.none,
                        edit_url: Upfront.Settings.admin_url + 'profile.php'
                    }
                ));
            }
        });

    });
}(jQuery));