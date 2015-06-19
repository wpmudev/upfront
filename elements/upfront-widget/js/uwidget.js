(function ($) {
define([
	'elements/upfront-widget/js/model',
	'elements/upfront-widget/js/element',
	'elements/upfront-widget/js/settings'
], function(UwidgetModel, UwidgetElement, UwidgetSettings) {

var l10n = Upfront.Settings.l10n.widget_element;

var UwidgetView = Upfront.Views.ObjectView.extend({

	loading: null,
	content_loaded: false,

	initialize: function(options){
		if(! (this.model instanceof UwidgetModel)){
			this.model = new UwidgetModel({properties: this.model.get('properties')});
		}

		this.constructor.__super__.initialize.call(this, [options]);
	},

	init: function () {
		Upfront.Events.on('entity:settings:activate', this.model.cache.clear, this.model);
	},

	get_content_markup: function () {
		var widget = this.model.get_property_value_by_name('widget');
			me = this
		;

		if (!widget) {
			return '<span class="no-widget-notice">' + l10n.select_widget + '</span>';
		}

		return this.model.cache.get(widget) || '';
	},

	on_render: function () {
		var widget = this.model.get_property_value_by_name('widget');
		if (!widget) return;

		if (!this.model.cache.get(widget)) {
			this._get_widget_markup(widget);
		}
	},

	_get_widget_markup: function (widget) {
		var me = this,
			specific_fields = this.model.get_property_value_by_name('widget_specific_fields'),
			instance = {}
		;

		this.loading = new Upfront.Views.Editor.Loading({
			loading: l10n.loading,
			done: l10n.done
		});
		this.loading.render();
		this.$el.empty().append(this.loading.el);

		for (key in specific_fields) {
			instance[specific_fields[key]['name']] =  this.model.get_property_value_by_name(specific_fields[key]['name']);
		}

		Upfront.Util.post({"action": "uwidget_get_widget_markup", "data": JSON.stringify({"widget": widget, "instance": instance})})
			.success(function (ret) {
				me.model.cache.set(widget, ret.data);

				me.loading.done(function(){
					me.render();
				});
			})
			.error(function (ret) {
				Upfront.Util.log("Error loading widget");
			})
		;
	},

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
