(function ($) {

var NavigationModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "NavigationModel");
		this.init_property("view_class", "NavigationView");
		
		this.init_property("element_id", Upfront.Util.get_unique_id("nav"));
		this.init_property("class", "c22 upfront-navigation");
		this.init_property("has_settings", 1);
	}
});

var NavigationView = Upfront.Views.ObjectView.extend({
	model:NavigationModel,
	get_content_markup: function () {
		var menu_id = this.model.get_property_value_by_name('menu_id'),
			me = this;
		if ( !menu_id )
			return "Please select menu on settings";
		Upfront.Util.post({"action": "upfront_load_menu_html", "data": menu_id})
			.success(function (ret) {
				me.$el.find('.upfront-object-content').html(ret.data);
			})
			.error(function (ret) {
				Upfront.Util.log("Error loading menu");
			});
		return 'Loading';
	}
});

var NavigationElement = Upfront.Views.Editor.Sidebar.Element.extend({
	render: function () {
		this.$el.html('Navigation');
	},
	add_element: function () {
		var object = new NavigationModel({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("nav")},
					//{"name": "class", "value": "c22"}
				]
			}),
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c22"},
					{"name": "has_settings", "value": 0}
				],
				"objects": [
					object
				]
			})
		;
		this.add_module(module);
	}
});

var NavigationSettings = Upfront.Views.Editor.Settings.Settings.extend({
	initialize: function () {
		this.panels = _([
			new NavigationMenuSettingsPanel({model: this.model})
		]);
	},
	get_title: function () {
		return "Navigation settings";
	}
});


var NavigationMenuSettingsPanel = Upfront.Views.Editor.Settings.Panel.extend({
	initialize: function () {
		this.settings = _([
			new NavigationMenuSetting_Menu({model: this.model}),
		]);
	},
	get_label: function () {
		return "Menu";
	},
	get_title: function () {
		return "Menu";
	}
});


var NavigationMenuSetting_Menu = Upfront.Views.Editor.Settings.Item.extend({
	
	render: function () {
		var value = this.model.get_property_value_by_name("menu_id"),
			me = this
		;
		// Wrap method accepts an object, with defined "title" and "markup" properties.
		// The "markup" one holds the actual Item markup.
		Upfront.Util.post({"action": "upfront_load_menu_list"})
			.success(function (ret) {
				options = _.map(ret.data, function (each) {
					return '<option value="' + each.term_id + '" ' + (value && value==each.term_id ? 'selected' : '') + '>' + each.name + '</option>';
				});
				me.wrap({
					"title": "Select Menu",
					"markup": '<select id="select_menu_id" name="select_menu_id">' + options + '</select>'
				});
			})
			.error(function (ret) {
				Upfront.Util.log("Error loading menu list");
			});
	},
	get_name: function () {
		return "menu_id";
	},
	get_value: function () {
		var menu_id = this.$el.find('#select_menu_id').val();
		return menu_id;
	}

});



Upfront.Application.LayoutEditor.add_object("Navigation", {
	"Model": NavigationModel, 
	"View": NavigationView,
	"Element": NavigationElement,
	"Settings": NavigationSettings
});
Upfront.Models.NavigationModel = NavigationModel;
Upfront.Views.NavigationView = NavigationView;

})(jQuery);