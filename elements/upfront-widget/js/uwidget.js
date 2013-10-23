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
	
	loading: null,
	content_loaded: false,
	
	init: function () {
		if ( !Upfront.data.uwidget )
			Upfront.data.uwidget = {};
	},
	
	get_content_markup: function () {
		var widget = this.model.get_property_value_by_name('widget'),
		 	me = this;
		if ( !widget )
			return "Please select widget on settings";
		var widget_data =  Upfront.data.uwidget[widget] || "";
		if ( widget_data )
			this.content_loaded = true;
		return widget_data;
	},
	
	on_render: function () {
		var widget = this.model.get_property_value_by_name('widget');
		if ( !widget )
			return;
		if ( typeof Upfront.data.uwidget[widget] == 'undefined' ){
			if ( this.content_loaded ){ // only display loading if there's already content
				this.loading = new Upfront.Views.Editor.Loading({
					loading: "Loading...",
					done: "Done!"
				});
				this.loading.render();
				this.$el.append(this.loading.el);
			}
			this._get_widget_markup(widget);
		}
	},
	
	_get_widget_markup: function (widget) {
		var me = this;
		Upfront.Util.post({"action": "uwidget_get_widget_markup", "data": JSON.stringify({"widget": widget})})
			.success(function (ret) {
				Upfront.data.uwidget[widget] = ret.data;
				if ( me.loading ){
					me.loading.done(function(){
						me.render();
					});
				}
				else {
					me.render();
				}
			})
			.error(function (ret) {
				Upfront.Util.log("Error loading widget");
		});
	}
});

var UwidgetElement = Upfront.Views.Editor.Sidebar.Element.extend({
	priority: 120,
	
	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-widget');
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

var UwidgetSettings = Upfront.Views.Editor.Settings.Settings.extend({
	
	initialize: function () {
		var widget_values = _.map(Upfront.data.uwidget.widgets, function (each) {
			return { label: each.name, value: each.class };
		});
		this.panels = _([
			new Upfront.Views.Editor.Settings.Panel({
				model: this.model,
				label: "Widget",
				title: "Widget settings",
				min_height: '200px',
				settings: [
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: "Select Widget",
						fields: [
							new Upfront.Views.Editor.Field.Select({
								model: this.model,
								property: 'widget',
								label: "",
								values: widget_values
							})
						]
					})
				]
			})
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