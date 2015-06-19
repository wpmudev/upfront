define([
	'elements/upfront-newnavigation/js/model'
], function(UnewnavigationModel) {
	
	var l10n = Upfront.Settings.l10n.newnavigation_element;

	var UnewnavigationElement = Upfront.Views.Editor.Sidebar.Element.extend({
			priority: 60,
		/**
		 * Set up element appearance that will be displayed on sidebar panel.
		 */
		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-nav');
			this.$el.html(l10n.element_name);
		},

		/**
		 * This will be called by editor to request module instantiation, set
		 * the default module appearance here
		 */
		add_element: function () {
			var object = new UnewnavigationModel(), // Instantiate the model
				// Since newnavigation entity is an object,
				// we don't need a specific module instance -
				// we're wrapping the newnavigation entity in
				// an anonymous general-purpose module
				module = new Upfront.Models.Module({
					"name": "",
					"properties": [
						{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
						{"name": "class", "value": "c24 upfront-newnavigation_module"},
						{"name": "has_settings", "value": 0},
						{"name": "row", "value": Upfront.Util.height_to_row(75)}
					],
					"objects": [
						object // The anonymous module will contain our newnavigation object model
					]
				})
			;
			// We instantiated the module, add it to the workspace
			this.add_module(module);
		}
	});

	return UnewnavigationElement;
});