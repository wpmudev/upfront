/* Initialises the edit version of the backbone models/views, and are rendered by the upfront api */
(function ($) {
require(['m-map/upfront', 'm-map/settings', 'm-map/mv'], function(){
	require(['m-map/edit-mv'], function(){

		Upfront.Models.mapDesc = Upfront.Models.ObjectModel.extend({});

		Upfront.Views.mapDesc = Upfront.Views.ObjectView.extend({
			initialize: function(){
				Upfront.Util.init_subview.apply(this, [Ufmap, 'mapDesc']);
			},

			get_content_markup: function () {
				return '';
			}
		});

		Upfront.Models.map = Upfront.Models.ObjectModel.extend({});

		Upfront.Views.map = Upfront.Views.ObjectView.extend({
			initialize: function(){
				Upfront.Util.init_subview.apply(this, [Ufmap, 'map']);
			},

			get_content_markup: function () {
				return '';
			}
		});

		var UmapElement = Upfront.Views.Editor.Sidebar.Element.extend({
			render: function () {
				this.$el.html('Add New Map');
			},

			add_element: function () {
				var desc = new Upfront.Models.mapDesc({
					"name": "",
					"properties": [
						{"name": "type", "value": 'mapDesc'},
						{"name": "view_class", "value": 'mapDesc'},

						{"name": "element_id", "value": Upfront.Util.get_unique_id("mapDescModel")},
						{"name": "class", "value": "c22"},
						{"name": "has_settings", "value": 0}
					]
				});

				var map = new Upfront.Models.map({
					"name": "",
					"properties": [
						{"name": "type", "value": 'map'},
						{"name": "view_class", "value": 'map'},

						{"name": "element_id", "value": Upfront.Util.get_unique_id("map")},
						{"name": "class", "value": "c22"},
						{"name": "has_settings", "value": 1}
					]
				});

				var module = new Upfront.Models.Module({ 
					"name": "",
					"properties": [
						{"name": "element_id", "value": Upfront.Util.get_unique_id("mapDesc")},
						{"name": "class", "value": "c22 upfront-map_module"},
						{"name": "has_settings", "value": 0}
					],
					"objects": [
						map, desc // The anonymous module will contain our search object model
					]
				});

				// We instantiated the module, add it to the workspace
				this.add_module(module);
			}
		});

		// Export to upfront core
		Upfront.Application.LayoutEditor.add_object("Umap", {
			"Model": Upfront.Models.map,
			"View": Upfront.Views.map,
			"Element": UmapElement,
			"Settings": UmapSettings
		});

	});

});
})(jQuery);