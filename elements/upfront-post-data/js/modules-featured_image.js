define([
	'elements/upfront-post-data/js/panel-abstractions',
	'text!elements/upfront-post-data/tpl/preset-styles/featured_image.html'
], function (Panel, template) {
	var l10n = Upfront.Settings.l10n.post_data_element;

	var Modules = {};
	Modules.template = template;

	Modules.part_featured_image = Panel.Toggleable.extend({
		title: l10n.thumb.fimg_part_title, 
		data_part: 'featured_image',
		get_fields: function () {
			var me = this;
			return [
				{
					type: "Checkboxes",
					property: "resize_featured",
					multiple: false,
					default_value: 0,
					values: [{ label: l10n.thumb.resize_to_fit, value: '1' }]
				},
				{
					type: "Select",
					label: l10n.thumb.fallback,
					property: "fallback_option",
					default_value: '',
					values: [
						{ label: l10n.thumb.hide, value: 'hide' },
						{ label: l10n.thumb.use_color, value: 'color' },
						{ label: l10n.thumb.use_default_img, value: 'image' }
					]
				},
				{
					type: "Color",
					property: "fallback_color",
					label: l10n.thumb.fallback_color
				},
				{
					type: "Button",
					compact: true,
					property: "fallback_image",
					label: l10n.thumb.fallback_image,
					on_click: function () {
						console.log(this.model.get("fallback_image"));
						Upfront.Media.Manager.open({
							multiple_selection: false,
							media_type:['images']
						}).done(function(popup, result) {
							if (!result || !result.length) return false;
							var imageModel = result.models[0],
								img = imageModel.get('image') ? imageModel.get('image') : result.models[0],
								url = 'src' in img ? img.src : ('get' in img ? img.get('original_url') : false)
							;
							if (!url) return false;
							me.model.set("fallback_image", url);
						});
					}
				},
			];
		},
		render: function () {
			Panel.Toggleable.prototype.render.apply(this, arguments);
			
			// Let's start stuff up on first render if we're not already there
			if (!this._fallback_selection_field || !this._fallback_color_field || !this._fallback_image_field ) {
				var fields = this.fields.toArray();
				this._fallback_selection_field = fields[1];
				this._fallback_color_field = fields[2];
				this._fallback_image_field = fields[3];
				
				if (this._fallback_selection_field) this.listenTo(this._fallback_selection_field, "changed", this.update_fields);
			}

			// Safe to proceed as normal now
			this.update_fields();
		},
		update_fields: function () {
			if (!this._fallback_selection_field) return false;

			var fallback = this._fallback_selection_field.get_value();

			if ('color' === fallback) {
				this._fallback_color_field.$el.show();
				this._fallback_image_field.$el.hide();
			} else if ('image' === fallback) {
				this._fallback_color_field.$el.hide();
				this._fallback_image_field.$el.show();
			} else {
				this._fallback_color_field.$el.hide();
				this._fallback_image_field.$el.hide();
			}
		},
		get_modules: function () {
			var modules = [], // featured image doesn't have typography
				me = this,
				name = function (name) { return 'static-' + me.data_part + '-' + name; }
			;

			modules.push({
				moduleType: 'Border',
				options: {
					toggle: true,
					state: 'static',
					fields: {
						use: name('use-border'),
						width: name('border-width'),
						type: name('border-type'),
						color: name('border-color')
					}
				}
			});

			modules.push({
				moduleType: 'Radius',
				options: {
					toggle: true,
					state: 'static',
					fields: {
						use: name('use-radius'),
						lock: name('lock'),
						radius: name('radius'),
						radius_number: name('radius_number'),
						radius1: name('radius1'),
						radius2: name('radius2'),
						radius3: name('radius3'),
						radius4: name('radius4')
					}
				}
			});
			
			return modules;
		}
	});

	return Modules;
});