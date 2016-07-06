(function($, Backbone){

    define([
        'scripts/upfront/upfront-views-editor/breakpoint/model'
    ], function ( Model ) {
        /**
         * For centralized access to breakpoints for updating and watching on changes.
         */
        return  Backbone.Collection.extend({
            model: Model,
            initialize: function() {
                this.on( 'change:active', this.on_change_active, this);
                this.on( 'change:enabled', this.on_change_enabled, this);
                this.on( 'change:width', this.on_change_width, this);
            },
            on_change_active: function(changed_model) {
                var prev_active_json = this.active ? this.active.toJSON() : false;
                this.prev_active = this.active;
                this.active = changed_model;

                _.each(this.models, function(model) {
                    if (model.get('id') === changed_model.get('id')) return;

                    model.set({ 'active': false }, { 'silent': true });
                });

                // Trigger multiple events so we can have some sort of priority order
                Upfront.Events.trigger("upfront:layout_size:change_breakpoint", changed_model.toJSON(), prev_active_json);
                Upfront.Events.trigger("upfront:layout_size:change_breakpoint:secondary", changed_model.toJSON(), prev_active_json);
                Upfront.Events.trigger("upfront:layout_size:change_breakpoint:tertiary", changed_model.toJSON(), prev_active_json);

                //todo This should go somewhere else
                if (this.prev_active) {
                    $('#page').removeClass(this.prev_active.get('id') + '-breakpoint');
                }
                $('#page').addClass(this.active.get('id') + '-breakpoint');

                if (this.active.get('default'))
                    $('#page').removeClass('responsive-breakpoint').addClass('default-breakpoint');
                else
                    $('#page').removeClass('default-breakpoint').addClass('responsive-breakpoint');
            },
            on_change_enabled: function(changed_model) {
                // If disabled point was active it will disapear and leave UI in broken state.
                if (changed_model.get('active') === false) return;

                // Activate default breakpoint and fire event.
                var default_breakpoint = this.get_default();

                default_breakpoint.set({ 'active': true });
            },
            on_change_width: function(changed_model, new_width) {
                Upfront.Events.trigger("upfront:layout_size:viewport_width_change", new_width);
            },
            sorted_by_width: function() {
                return _.sortBy(this.models, function(model) {
                    return model.get('width');
                });
            },
            get_active: function() {
                var active_breakpoint = this.findWhere({ 'active': true });
                if (_.isUndefined(active_breakpoint) === false) return active_breakpoint;

                active_breakpoint = this.get_default();
                active_breakpoint.set({ 'active': true });
                return active_breakpoint;
            },
            get_enabled: function() {
                var enabled_breakpoints = this.where({ 'enabled': true });
                if (_.isUndefined(enabled_breakpoints) === false && enabled_breakpoints.length > 0) return enabled_breakpoints;

                return [this.get_active()];


            },
            get_default: function() {
                var default_breakpoint = this.findWhere({ 'default': true });
                if (_.isUndefined(default_breakpoint)) {
                    default_breakpoint = this.findWhere({ 'id': 'desktop' });
                    if (default_breakpoint) default_breakpoint.set({ 'default': true });
                }
                if (_.isUndefined(default_breakpoint)) throw 'Breakpoints are not loaded properly.';

                return default_breakpoint;
            },
            get_unique_id: function() {
                var id = 'custom-' + (new Date());

                // Ensure id is unique
                while (!_.isUndefined(this.findWhere({ 'id': id }))) {
                    id = 'custom-' + (new Date());
                }

                return id;
            }
        });

    });
}(jQuery, Backbone));