(function ($) {
define([
		'elements/upfront-widget/js/settings'
	], function(UwidgetSettings) {

	var l10n = Upfront.Settings.l10n.widget_element;

	var UwidgetModel = Upfront.Models.ObjectModel.extend({
		init: function () {
			var properties = _.clone(Upfront.data.uwidget.defaults);
			properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
			this.init_properties(properties);
		}
	});

	var UwidgetView = Upfront.Views.ObjectView.extend({

		loading: null,
		content_loaded: false,
		initialize: function(options){
			if(! (this.model instanceof UwidgetModel)){
				this.model = new UwidgetModel({properties: this.model.get('properties')});
			}

			// copy values from saved ones to the realtime rendering ones in the editor
			this.model.set_property('current_widget', this.model.get_property_value_by_name('widget'), true);
			this.model.set_property('current_widget_specific_settings', this.model.get_property_value_by_name('widget_specific_fields'), true);

			this.constructor.__super__.initialize.call(this, [options]);

		},

		init: function () {

			if ( !Upfront.data.uwidget.widgets_cache ) {
				Upfront.data.uwidget.widgets_cache = {};
			}

			Upfront.Events.on('entity:settings:activate', this.clear_cache, this);

		},

		clear_cache: function() {
			Upfront.data.uwidget.widgets_cache[this.model.get_property_value_by_name('current_widget')+this.cid] = null;
		},

		get_content_markup: function () {

			var widget = this.model.get_property_value_by_name('current_widget');
				me = this;

				if ( !widget || widget === '') {
					return '<span class="no-widget-notice">' + l10n.select_widget + '</span>';
				}

				var widget_data =  Upfront.data.uwidget.widgets_cache[widget+this.cid] || '';

				if ( widget_data ) {
					this.content_loaded = true;
				}

				return widget_data;
		},

		on_render: function () {

			var widget = this.model.get_property_value_by_name('current_widget');
			if ( !widget ) {
				return;
			}

			if ( typeof Upfront.data.uwidget.widgets_cache[widget+this.cid] == 'undefined' || Upfront.data.uwidget.widgets_cache[widget+this.cid] == null){

				if ( this.content_loaded ){ // only display loading if there's already content
					this.loading = new Upfront.Views.Editor.Loading({
						loading: l10n.loading,
						done: l10n.done
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

			var specific_fields = this.model.get_property_value_by_name('current_widget_specific_fields') || this.model.get_property_value_by_name('widget_specific_fields');

			var instance = {};

			for( var key in specific_fields) {
				instance[specific_fields[key]['name']] =  this.model.get_property_value_by_name(specific_fields[key]['name']);
			}

			$(document).trigger('upfront:uwidget:get_markup:start', me);
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
					Upfront.Events.trigger('entity:object:refresh', me);
					$(document).trigger('upfront:uwidget:get_markup:finish', me);

				})
				.error(function (ret) {
					Upfront.Util.log("Error loading widget");

			});
		}



	});

	var UwidgetElement = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 80,

		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-widget');
			this.$el.html(l10n.element_name);
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




	Upfront.Application.LayoutEditor.add_object("Uwidget", {
		"Model": UwidgetModel,
		"View": UwidgetView,
		"Element": UwidgetElement,
		"Settings": UwidgetSettings,
		cssSelectors: {
			'.widget': {label: l10n.css.container_label, info: l10n.css.container_info},
			'.widget a': {label: l10n.css.links_label, info: l10n.css.links_info}
		},
		cssSelectorsId: Upfront.data.uwidget.defaults.type
	});
	Upfront.Models.UwidgetModel = UwidgetModel;
	Upfront.Views.UwidgetView = UwidgetView;


});

})(jQuery);
