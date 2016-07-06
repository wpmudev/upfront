(function($, Backbone){

    define([], function (  ) {
        return Backbone.View.extend({
            className: 'upfront-region-fixed-edit-pos',
            initialize: function () {

            },
            render: function () {
                var me = this,
                    grid = Upfront.Settings.LayoutEditor.Grid,
                    top = this.model.get_property_value_by_name('top'),
                    is_top = ( typeof top == 'number' ),
                    left = this.model.get_property_value_by_name('left'),
                    is_left = ( typeof left == 'number' ),
                    bottom = this.model.get_property_value_by_name('bottom'),
                    is_bottom = ( typeof bottom == 'number' ),
                    right = this.model.get_property_value_by_name('right'),
                    is_right = ( typeof right == 'number' ),
                    change = function () {
                        var value = this.get_value(),
                            saved = this.get_saved_value();
                        if (value != saved)
                            this.property.set({'value': value});
                    };
                this.fields = {
                    width: new Upfront.Views.Editor.Field.Number({
                        model: this.model,
                        property: 'width',
                        label: l10n.width,
                        label_style: "inline",
                        min: 3 * grid.column_width,
                        max: Math.floor(grid.size / 2) * grid.column_width
                    }),
                    height: new Upfront.Views.Editor.Field.Number({
                        model: this.model,
                        property: 'height',
                        label: l10n.height,
                        label_style: "inline",
                        min: 3 * grid.baseline
                    })
                };
                if (is_top || !is_bottom)
                    this.fields.top = new Upfront.Views.Editor.Field.Number({
                        model: this.model,
                        property: 'top',
                        label: l10n.top,
                        label_style: "inline",
                        min: 0
                    });
                else
                    this.fields.bottom = new Upfront.Views.Editor.Field.Number({
                        model: this.model,
                        property: 'bottom',
                        label: l10n.bottom,
                        label_style: "inline",
                        min: 0
                    });
                if (is_left || !is_right)
                    this.fields.left = new Upfront.Views.Editor.Field.Number({
                        model: this.model,
                        property: 'left',
                        label: l10n.left,
                        label_style: "inline",
                        min: 0
                    });
                else
                    this.fields.right = new Upfront.Views.Editor.Field.Number({
                        model: this.model,
                        property: 'right',
                        label: l10n.right,
                        label_style: "inline",
                        min: 0
                    });
                _.each(this.fields, function (field) {
                    field.render();
                    field.delegateEvents();
                    me.$el.append(field.$el);
                });
            },
            update_fields: function () {
                _.each(this.fields, function (field) {
                    var new_value = field.get_saved_value();
                    field.set_value(new_value);
                });
            }
        });

    });

}(jQuery, Backbone));