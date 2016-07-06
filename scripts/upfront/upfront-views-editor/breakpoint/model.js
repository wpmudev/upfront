(function(){

    define([], function (  ) {
        /**
         * For easier setup of breakpoints.
         */
        return  Backbone.Model.extend({
            defaults: {
                'default': false,
                'name': 'Breakpoint',
                'short_name': 'breakpoint',
                'fixed': false,
                'enabled': false,
                'active': false,
                'width': 240,
                'columns': 5,
                'typography': {},
                'styles': ''
            },
            initialize: function() {
                // Fix 0 columns
                if (this.attributes.columns === 0 && this.attributes.width > 0) {
                    this.attributes.columns = Math.round(this.attributes.width / 45); //todo get column width from theme
                }

                this.on('change:width', this.update_columns, this);
                this.on('change:columns', this.update_width, this);
                this.on('change:name', this.update_short_name, this);
            },
            update_width: function(me, new_columns) {
                var columns = parseInt(new_columns, 10);

                if (columns > 24) {
                    this.set({ 'columns': 24 });
                    return;
                }
                if (columns < 5) {
                    this.set({ 'columns': 5 });
                    return;
                }

                this.attributes.width = columns * 45; //todo get column width from theme
            },
            update_columns: function(me, new_width) {
                var new_columns;
                var width = parseInt(new_width, 10);

                if (width > 1080) {
                    this.set({ 'width': 1080 });
                    return;
                }
                if (width < 240) {
                    this.set({ 'width': 240 });
                    return;
                }

                new_columns = Math.round(width / 45); //todo get column width from theme
                if (this.attributes.columns !== new_columns) {
                    this.attributes.columns =  new_columns;
                }
            },
            update_short_name: function(me, new_name) {
                this.attributes.short_name = new_name;
            },
            /* For compatibility with typography editor */
            get_property_value_by_name: function(name) {
                return this.get(name);
            },
            /* For compatibility with typography editor */
            set_property: function(name, value) {
                var map = {};
                map[name] = value;
                this.set(map);
            }
        });
    });

}());