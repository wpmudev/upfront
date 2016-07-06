(function($, Backbone){
    define([
        'scripts/upfront/upfront-views-editor/breakpoint/storage'
    ], function (storage) {



        // Breakpoint events tests - uncomment if needed
        // Upfront.Events.on("upfront:layout_size:change_breakpoint", function(breakpoint, prev_breakpoint) {
        // if (prev_breakpoint) console.log(['Breakpoint deactivated', prev_breakpoint.name, prev_breakpoint.width].join(' '));
        // });
        // Upfront.Events.on("upfront:layout_size:viewport_width_change", function(new_width) {
        // console.log(['Viewport width changed:', new_width].join(' '));
        // });



        return {
            storage: storage
        };

    });
}(jQuery, Backbone));