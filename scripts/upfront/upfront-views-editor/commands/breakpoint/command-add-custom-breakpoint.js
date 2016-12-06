(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command',
        "scripts/upfront/upfront-views-editor/breakpoint/model",
        "scripts/upfront/upfront-views-editor/breakpoint/storage"
    ], function ( Command, BreakpointEditPanel, breakpoints_storage ) {

        return Backbone.View.extend({
            tagName: 'li',
            className: 'upfornt-icon upfront-icon-add',
            id: 'new-custom-breakpoint',
            events: {
                'click': 'add_breakpoint'
            },
            render: function () {
                this.$el.html(l10n.new_breakpoint);
            },
            initialize: function(options) {
                this.collection = breakpoints_storage.get_breakpoints();
            },
            add_breakpoint: function(event) {
                event.preventDefault();
                var popup;
                var new_breakpoint = new Breakpoint_Model({ 'id': this.collection.get_unique_id() });
                this.collection.add(new_breakpoint);
                new_breakpoint.set({ 'enabled': true });
                new_breakpoint.set({ 'active': true });

                popup = Upfront.Popup.open(function (data, $top, $bottom) {
                    $top.empty();
                    var $content = $(this);
                    var editPanel = new BreakpointEditPanel({ model: new_breakpoint });

                    $content
                        .append(editPanel.render().el);
                    $bottom.append('<div class="breakpoint-edit-ok-button">' + l10n.ok + '</div>');
                    $('#upfront-popup-close').hide();
                    $('.breakpoint-edit-ok-button').on('click', function() {
                        Upfront.Popup.close();
                        $('#upfront-popup-close').show();
                    });
                }, {
                    width: 400
                });
            }
        });

    });
}(jQuery));