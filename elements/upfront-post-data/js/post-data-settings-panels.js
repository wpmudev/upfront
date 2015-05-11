(function ($) {
define([
	'text!elements/upfront-post-data/tpl/views.html',
	'elements/upfront-post-data/js/post-data-settings-parts'
], function(tpl, Parts) {

var l10n = Upfront.Settings.l10n.post_data_element;
var $template = $(tpl);

var Panels = {};


Panels.PostParts = Upfront.Views.Editor.Settings.Panel.extend({

	initialize: function (opts) {
		this.options = opts;
		var me = this,
			data_type = this.model.get_property_value_by_name('data_type'),
			parts = _.map(Upfront.data['upfront_post_data_' + data_type].type_parts, function (part) {
				return {label: l10n['part_' + part], value: part}
			}),
			part_settings = new PartSettings({
				model: this.model
			}),
			autorefresh = function (value) {
				this.model.set_property(this.options.property, this.get_value());
				this.model.set_property("post_parts", this.get_value(), false);
				me.trigger("settings:dispatched");
			}
		;
		this.settings = _([
			part_settings
		]);
	},

	get_label: function () {
		return l10n.post_parts;
	},

	get_title: function () {
		return l10n.post_parts;
	}
});

var PostPartsPickerSettings = Upfront.Views.Editor.Settings.Item.extend({
	className: 'uposts-parts-picker-setting'
});

var PartSettings = Upfront.Views.Editor.Settings.Item.extend({
	group: false,
	initialize: function (opts) {
		this.options = opts;
		this.fields = _([
			new PartSettings_Part({
				model: this.model,
				name: "post_parts",
				label: "Data Components"
			})
		]);
	}
});

var PartSettings_Part = Upfront.Views.Editor.Field.Hidden.extend({
	render: function () {
		Upfront.Views.Editor.Field.Hidden.prototype.render.apply(this);
		this.$el.append('<ul class="postdata_parts"></ul>');
		var me = this,
			data_type = this.model.get_property_value_by_name('data_type'),
			parts = Upfront.data['upfront_post_data_' + data_type].type_parts,
			$parent = this.$el.find("ul.postdata_parts")
		;

		_.each(parts, function (part, idx) {
			var pt = Parts.get_part(part, me.model);
			pt.render();
			$parent.append(pt.$el);
		});
	},
	get_value: function () {
		return this.model.get_property_value_by_name(this.options.property);
	}
});

return Panels;

});
})(jQuery);
