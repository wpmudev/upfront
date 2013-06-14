(function ($) {

var UwidgetModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "UwidgetModel");
		this.init_property("view_class", "UwidgetView");
		
		this.init_property("element_id", Upfront.Util.get_unique_id("uwidget-object"));
		this.init_property("class", "c22 upfront-widget");
		this.init_property("has_settings", 1);
	}
});

var UwidgetView = Upfront.Views.ObjectView.extend({
	
	get_content_markup: function () {
		var widget = this.model.get_property_value_by_name('widget'),
		 	me = this;
		if ( !widget )
			return "Please select widget on settings";
		Upfront.Util.post({"action": "uwidget_get_widget_markup", "data": JSON.stringify({"widget": widget})})
			.success(function (ret) {
				me.$el.find('.upfront-object-content').html(ret.data);
			})
			.error(function (ret) {
				Upfront.Util.log("Error loading widget");
		});
		return 'Loading';
	},
	
	on_render: function () {
		
	}
});

var UwidgetElement = Upfront.Views.Editor.Sidebar.Element.extend({
	
	render: function () {
		//this.$el.addClass('upfront-icon-element upfront-icon-element-widget');
		this.$el.html('Widget');
	},

	add_element: function () {
		var object = new UwidgetModel(),
			module = new Upfront.Models.Module({ 
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c6 upfront-widget_module"},
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

// Settings - load widget list first before adding object

var _widgets;
Upfront.Util.post({"action": "uwidget_load_widget_list"}).success(function (ret) { _widgets = ret.data; });
		
var UwidgetSettingsPanel = Upfront.Views.Editor.Settings.Panel.extend({

	initialize: function () {
		this.settings = _([
			new UwidgetSetting_Widget({model: this.model}),
		]);
	},

	get_label: function () {
		return "Widget";
	},

	get_title: function () {
		return "Widget settings";
	}
});


var UwidgetSetting_Widget = Upfront.Views.Editor.Settings.Item.extend({
	
	render: function () {
		var widget = this.model.get_property_value_by_name("widget"),
			select_list = _.map(_widgets, function (each) {
				return '<option value="' + each.class + '" ' + (widget && each.class == widget ? 'selected' : '') + '>' + each.name + '</option>';
			});
		
		this.wrap({
			"title": "Select Widget",
			"markup": '<select id="select_widget" name="select_widget">' + select_list.join('') + '</select>'
		});
	},
	
	get_name: function () {
		return "widget";
	},
	
	get_value: function () {
		var widget = this.$el.find('select#select_widget').val();
		return widget;
	}
});

var UwidgetSettings = Upfront.Views.Editor.Settings.Settings.extend({
	
	initialize: function () {
		this.panels = _([
			new UwidgetSettingsPanel({model: this.model}),
		]);
	},


	get_title: function () {
		return "Widget settings";
	}
});



Upfront.Application.LayoutEditor.add_object("Uwidget", {
	"Model": UwidgetModel, 
	"View": UwidgetView,
	"Element": UwidgetElement,
	"Settings": UwidgetSettings
});
Upfront.Models.UwidgetModel = UwidgetModel;
Upfront.Views.UwidgetView = UwidgetView;


})(jQuery);