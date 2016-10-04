(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;

    define([
        'scripts/upfront/upfront-views-editor/breakpoint/storage',
        'scripts/upfront/upfront-views-editor/breakpoint/breakpoint-edit-panel'
    ], function ( storage, BreakpointEditPanel ) {
        return Backbone.View.extend({
            className: 'breakpoint-edit',
            events: {
                'click #edit-breakpoint': 'edit_breakpoint'
            },
            initialize: function(options) {
                this.options = options || {};
                this.collection = storage.get_breakpoints();
                this.listenTo(this.collection, 'change:active', this.render);
            },
            render: function() {
                this.$el.html('');
                this.active_breakpoint = this.collection.get_active();

                if (this.active_breakpoint.get('fixed')) return this;

                this.$el.html('<a href="" id="edit-breakpoint">' + l10n.edit_breakpoint + '</a>');

                return this;
            },
            edit_breakpoint: function(event) {
                event.preventDefault();
                var popup;

                popup = Upfront.Popup.open(function (data, $top, $bottom) {
                    $top.empty();
                    var $content = $(this);
                    var editPanel = new BreakpointEditPanel();

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