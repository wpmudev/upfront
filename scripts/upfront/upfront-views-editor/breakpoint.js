(function($, Backbone){
    define([
        'scripts/upfront/upfront-views-editor/breakpoint/model',
        'scripts/upfront/upfront-views-editor/breakpoint/collection',
        'scripts/upfront/upfront-views-editor/breakpoint/storage',
        'scripts/upfront/upfront-views-editor/breakpoint/breakpoint-edit-button',
        'scripts/upfront/upfront-views-editor/breakpoint/breakpoint-edit-panel',
        'scripts/upfront/upfront-views-editor/breakpoint/breakpoint-width-input',
        'scripts/upfront/upfront-views-editor/breakpoint/breakpoints-toggler'

    ], function (Model, Collection, storage, EditButton, EditPanel, WidthInput, Toggler) {



        // Breakpoint events tests - uncomment if needed
        // Upfront.Events.on("upfront:layout_size:change_breakpoint", function(breakpoint, prev_breakpoint) {
        // if (prev_breakpoint) console.log(['Breakpoint deactivated', prev_breakpoint.name, prev_breakpoint.width].join(' '));
        // });
        // Upfront.Events.on("upfront:layout_size:viewport_width_change", function(new_width) {
        // console.log(['Viewport width changed:', new_width].join(' '));
        // });



        return {
            Model: Model,
            Collection: Collection,
            storage: storage,
            EditButton: EditButton,
            EditPanel: EditPanel,
            WidthInput: WidthInput,
            Toggler: Toggler
        };

    });
}(jQuery, Backbone));