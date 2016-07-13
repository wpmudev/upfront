(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command',
        "text!upfront/templates/edit_background_area.html"
    ], function ( Command, edit_background_area_tpl ) {

        return Command.extend({
            "className": "command-edit-background-area",
            events: {
                "click .switch": "on_switch"
            },
            initialize: function() {
                Upfront.Events.on("command:newpage:start", this.switchOff, this);
                Upfront.Events.on("command:newpost:start", this.switchOff, this);
            },
            render: function () {
                var template = _.template(edit_background_area_tpl, {});
                this.$el.html(template);
            },
            on_switch: function () {
                var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
                if ( this.$el.find('.switch-on').hasClass('active') ){ // Switch off
                    this.switchOff();
                }
                else { // Switch on
                    this.$el.find('.switch-off').removeClass('active');
                    this.$el.find('.switch-on').addClass('active');
                    $main.addClass('upfront-region-editing');
                    Upfront.Events.trigger("command:region:edit_toggle", true);
                }
            },
            switchOff: function() {
                var $main = $(Upfront.Settings.LayoutEditor.Selectors.main);
                this.$el.find('.switch-off').addClass('active');
                this.$el.find('.switch-on').removeClass('active');
                $main.removeClass('upfront-region-editing');
                $main.removeClass('upfront-region-lightbox-editing');
                Upfront.Events.trigger("command:region:edit_toggle", false);
            }
        });

    });
}(jQuery));
