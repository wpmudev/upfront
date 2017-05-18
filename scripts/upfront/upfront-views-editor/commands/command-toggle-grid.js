(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command',
        "text!upfront/templates/overlay_grid.html"
    ], function ( Command, overlay_grid_tpl ) {

        return Command.extend({
            className: "command-grid sidebar-commands-small-button icon-button",

            initialize: function() {
                this.constructor.__super__.initialize.apply(this, arguments);
                this.listenTo(Upfront.Events, "entity:region:added", this.update_grid);
                this.listenTo(Upfront.Events, "upfront:layout_size:change_breakpoint", this.update_grid);
                this.listenTo(Upfront.Events, "grid:toggle", this.on_click);
            },

            render: function () {
                this.$el.addClass('upfront-icon upfront-icon-grid');
                this.$el.prop("title", l10n.toggle_grid);
            },
            on_click: function () {
                if (!$('.upfront-overlay-grid').size()) this.create_grid();
                this.toggle_grid();
            },
            create_grid: function () {
                this.update_grid();
                //this.attach_event();
            },
            toggle_grid: function () {
                if (!Upfront.Application.get_gridstate()) this.show_grid();
                else this.hide_grid();
            },
            show_grid: function () {
                this.$el.addClass('upfront-icon-grid-active');
                $('.upfront-overlay-grid').addClass('upfront-overlay-grid-show');
                Upfront.Application.set_gridstate(true);
            },
            hide_grid: function () {
                this.$el.removeClass('upfront-icon-grid-active');
                $('.upfront-overlay-grid').removeClass('upfront-overlay-grid-show');
                Upfront.Application.set_gridstate(false);
            },
            update_grid: function (size) {
                var $main = $(Upfront.Settings.LayoutEditor.Selectors.main),
                    grid = Upfront.Settings.LayoutEditor.Grid;
                $('.upfront-overlay-grid').remove();
                $('.upfront-grid-layout, .upfront-region-side-fixed .upfront-modules_container, .upfront-region-side-lightbox .upfront-modules_container').each(function(){
                    var columns = grid.size,
                        template = _.template(overlay_grid_tpl, {columns: columns, size_class: grid['class'], style: 'simple'});
                    $(this).prepend(template);

                    //Adjust grid rulers position
                    Upfront.Application.adjust_grid_padding_settings(this);
                });

                if (!!Upfront.Application.get_gridstate()) this.show_grid();
            }
        });

    });
}(jQuery));
