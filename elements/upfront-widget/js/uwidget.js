(function ($) {
define(function() {

var UwidgetModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		var properties = _.clone(Upfront.data.uwidget.defaults);
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + "-object");
		this.init_properties(properties);
	}
});

var UwidgetView = Upfront.Views.ObjectView.extend({

	loading: null,
	cssSelectors: {
		'.widget': {label: 'Widget container', info: 'The container that wraps widget element'},
		'.widget a': {label: 'Widget links', info: 'Links inside the widget element'},
	},
	content_loaded: false,
	initialize: function(options){
		if(! (this.model instanceof UwidgetModel)){
			this.model = new UwidgetModel({properties: this.model.get('properties')});
		}

		this.constructor.__super__.initialize.call(this, [options]);



	},

	init: function () {

		if ( !Upfront.data.uwidget.widgets_cache )
			Upfront.data.uwidget.widgets_cache = {};

		Upfront.Events.on("entity:settings:activate", this.clear_cache, this);

	},

	clear_cache: function() {
		Upfront.data.uwidget.widgets_cache[this.model.get_property_value_by_name('widget')+this.cid] = null;
	},

	get_content_markup: function () {

		var widget = this.model.get_property_value_by_name('widget');
		 	me = this;

			if ( !widget )
				return "Please select widget on settings";

			var widget_data =  Upfront.data.uwidget.widgets_cache[widget+this.cid] || "";

			if ( widget_data ) {
				this.content_loaded = true;
			}

			return widget_data;
	},

	on_render: function () {

		var widget = this.model.get_property_value_by_name('widget');
		if ( !widget )
			return;

		if ( typeof Upfront.data.uwidget.widgets_cache[widget+this.cid] == 'undefined' || Upfront.data.uwidget.widgets_cache[widget+this.cid] == null){

			if ( this.content_loaded ){ // only display loading if there's already content
				this.loading = new Upfront.Views.Editor.Loading({
					loading: "Loading...",
					done: "Done!"
				});
				this.loading.render();
				this.$el.append(this.loading.el);
			}
			this._get_widget_markup(widget);
			//this.get_widget_settings(widget);
		}

	},
	_get_widget_markup: function (widget) {
		var me = this;
		//prepare instance

		var specific_fields = this.model.get_property_value_by_name('widget_specific_fields')

		var instance = {};


		for( key in specific_fields) {
				instance[specific_fields[key]['name']] =  this.model.get_property_value_by_name(specific_fields[key]['name']);
		}

		Upfront.Util.post({"action": "uwidget_get_widget_markup", "data": JSON.stringify({"widget": widget, "instance": instance})})
			.success(function (ret) {

				Upfront.data.uwidget.widgets_cache[widget+me.cid] = ret.data;
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
	},



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
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": Upfront.Util.height_to_row(150)}
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
var UwidgetSpecific_Settings = Upfront.Views.Editor.Settings.Item.extend({
	/**
	 * Set up setting item appearance.
	 */

	get_title: function(){
		for(i in Upfront.data.uwidget.widgets) {
			if(Upfront.data.uwidget.widgets[i].class == this.model.get_property_value_by_name('selected_widget'))
				return Upfront.data.uwidget.widgets[i].name
		}
		return this.model.get_property_value_by_name('widget');
	},
	update_settings: function(widget, parent) {

		var self = this;
		Upfront.Util.post({"action": "uwidget_get_widget_admin_form", "data": JSON.stringify({"widget": widget})})
		.success(function (ret) {
			self.model.set_property('widget_specific_fields', ret.data);
			self.$el.html('');
			self.model.set_property('selected_widget', widget);
			self.model.set_property('widget', widget);
			self.udpate_fields();

			self.render();
			parent.$el.parent().parent().parent().parent().parent().parent().parent().height(parent.$el.parent().parent().parent().parent().height()+22);
		}).error(function (ret) {
			console.log("error receiving widget specific settings");
		});


	},
	initialize: function() {

		this.model.set_property('selected_widget', this.model.get_property_value_by_name('widget'));
		this.udpate_fields();

	},
	udpate_fields: function() {
		var self = this;
		this.fields=_([]);
		var specific_fields = this.model.get_property_value_by_name('widget_specific_fields');

		for( key in specific_fields) {
			if(specific_fields[key]['type'] == 'select') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Select({
								model: this.model,
								property: specific_fields[key]['name'],
								label: specific_fields[key]['label'],
								values: _.map(specific_fields[key]['options'], function(option, key){ return { label: option, value: key }; }),
								change: this.clear_cache

							});
			}
			else if(specific_fields[key]['type'] == 'text') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Text({
								model: this.model,
								property: specific_fields[key]['name'],
								label: specific_fields[key]['label'],
								value: specific_fields[key]['value'],
								change: this.clear_cache
							});
			}
			else if(specific_fields[key]['type'] == 'textarea') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Textarea({
								model: this.model,
								property: specific_fields[key]['name'],
								label: specific_fields[key]['label'],
								value: specific_fields[key]['value'],
								change: this.clear_cache
							});
			}
			else if(specific_fields[key]['type'] == 'checkbox') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Checkboxes({
								model: this.model,
								property: specific_fields[key]['name'],
								label: '',
								values: [{ label: specific_fields[key]['label'], value: specific_fields[key]['value'] }],
								change: this.clear_cache
							});
			}
			else if(specific_fields[key]['type'] == 'radio') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Radios({
								model: this.model,
								property: specific_fields[key]['name'],
								label: '',
								values: [{ label: specific_fields[key]['label'], value: specific_fields[key]['value'] }],
								change: this.clear_cache
							});

			}
		}
	},
	clear_cache: function() { Upfront.data.uwidget.widgets_cache = {}; }
});


var UwidgetSettings = Upfront.Views.Editor.Settings.Settings.extend({

		initialize: function (opts) {
			this.options= opts;

		var widget_values = _.map(Upfront.data.uwidget.widgets, function (each) {
			return { label: each.name, value: each.class };
		});

		var panel = new Upfront.Views.Editor.Settings.Panel({
			model: this.model,
			label: "Widget",
			title: "Widget settings",
			min_height: '200px'
		});

		var dynamic_settings = new UwidgetSpecific_Settings({model: this.model});

		var settings_item1 = new Upfront.Views.Editor.Settings.Item({
			model: this.model,
			title: "Select Widget",
			fields: [
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					property: 'widget',
					label: "",
					values: widget_values,
					change: function() {

						var $checked = this.$el.find('.upfront-field-select-option input:checked');
						if(this.model.get_property_value_by_name('selected_widget') != $checked.val())
							dynamic_settings.update_settings($checked.val(), this);
						}
				})
			]
		});

		panel.settings = _([settings_item1, dynamic_settings]);

		this.panels = _([panel]);
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


});

})(jQuery);
