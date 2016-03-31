define([
	'elements/upfront-post-data/js/panel-abstractions',
	'text!elements/upfront-post-data/tpl/preset-styles/post_data.html',
	'scripts/upfront/preset-settings/util',
], function (Panel, template, Util) {

	var Modules = {};
	Modules.template = template;

	Modules.part_date_posted = Panel.Toggleable.extend({
		title: "Date posted",
		data_part: 'date_posted',
		get_fields: function () {
			return [
				{
					type: "Select",
					label: "Date Format",
					multiple: false,
					property: "predefined_date_format",
					values: [
						{ label: "WordPress date", value: "wp_date" },
						{ label: "30 Jan 2015", value: "d M Y" },
						{ label: "Jan 30 2015", value: "M d Y" },
						{ label: "30 01 2015", value: "d m Y" },
						{ label: "01 30 2015", value: "m d Y" },
						{ label: "Custom PHP Format", value: "0" },
					],
					default_value: "wp_date"
				},
				{
					type: "Text",
					label: "PHP Format",
					className: 'php_date_format',
					label_style: 'inline',
					property: "date_posted_format"
				},
				{
					type: "Button",
					label: "Reference",
					className: 'php_date_reference',
					compact: true,
					on_click: function (e) {
						if (e && e.preventDefault) e.preventDefault();
						if (e && e.stopPropagation) e.stopPropagation();

						var win = window.open('https://codex.wordpress.org/Formatting_Date_and_Time', '_blank');
						win.focus();

						return false;
					}
				},
			];
		},
		render: function () {
			Panel.Toggleable.prototype.render.apply(this);

			if (!this._field_fmt_select || !this._field_fmt || !this._field_fmt_ref) {
				var fields = this.fields.toArray();
				this._field_fmt_select = fields[0];
				this._field_fmt = fields[1];
				this._field_fmt_ref = fields[2];

				if (this._field_fmt_select) this.listenTo(this._field_fmt_select, "changed", this.update_fields);
			}

			this.update_fields();
		},
		update_fields: function () {
			if (!this._field_fmt_select) return false;
			var fmt = this._field_fmt_select.get_value();

			if ("0" !== fmt) {
				this._field_fmt.$el.hide();
				this._field_fmt_ref.$el.hide();
			} else {
				this._field_fmt.$el.show();
				this._field_fmt_ref.$el.show();
			}
		}
	});

	Modules.part_title = Panel.Toggleable.extend({ title: "Title", data_part: 'title' });
	
	Modules.part_content = Panel.Toggleable.extend({
		title: "Contents",
		data_part: 'content',
		get_fields: function () {
			var grid_size = Upfront.Settings.LayoutEditor.Grid.size || 24,
				half_grid = parseInt((grid_size-1)/2)
			;
			return [
/*
				{
					type: "Number",
					label: "Limit words",
					label_style: 'inline',
					property: "content_length"
				},
*/
				{
					type: "Number",
					label: "Left indent",
					label_style: 'inline',
					min: 0,
					max: half_grid,
					default_value: 0,
					className: 'content-indent indent-left',
					property: "left_indent"
				},
				{
					type: "Number",
					label: "Right indent",
					label_style: 'inline',
					min: 0,
					max: half_grid,
					default_value: 0,
					className: 'content-indent indent-right',
					property: "right_indent"
				},
				{
					type: "Checkboxes",
					property: "trigger_splitters",
					default_value: 0,
					values: [{ label: 'Convert 3 Returns into Divider', value: '1' }]
				},
				{
					type: "Checkboxes",
					property: "allow_splitting",
					default_value: 0,
					values: [{ label: 'Allow content splitting', value: '1' }]
				},
				{
					type: "Number",
					label: "Content part",
					default_value: 0,
					min: 0,
					label_style: 'inline',
					property: "content_part"
				}
			];
		},
		render: function () {
			Panel.Toggleable.prototype.render.apply(this);

			// Let's start stuff up on first render if we're not already there
			if (!this._allow_splitting_field || !this._content_part_field) {
				var fields = this.fields.toArray();
				this._allow_splitting_field = fields[3];
				this._content_part_field = fields[4];
				
				if (this._allow_splitting_field) this.listenTo(this._allow_splitting_field, "changed", this.update_fields);
			}

			// Safe to proceed as normal now
			this.update_fields();

			if (!(this._padding_fields || {}).left || !!(this._padding_fields || {}).right) {
				var fields = this.fields.toArray(),
					padding = {}
				;
				padding.left = fields[0];
				padding.right = fields[1];

				this._padding_fields = padding;

				if ((this._padding_fields || {}).left) this.listenTo(this._padding_fields.left, "changed", this.normalize_left_padding);
				if ((this._padding_fields || {}).right) this.listenTo(this._padding_fields.right, "changed", this.normalize_right_padding);
			}
		},
		update_fields: function () {
			if (!this._allow_splitting_field) return false;

			var allow_splitting = this._allow_splitting_field.get_value();

			if (allow_splitting && allow_splitting.length) {
				Upfront.data.upfront_post_data.split_allowed = true; // yeah, so keep track of this
				this._content_part_field.$el.show();
			} else {
				this._content_part_field.$el.hide();
			}
		},

		/**
		 * Utility method for padding recalculation
		 *
		 * This gets triggered on every content indent change
		 * and updates the calculated left/right padding values
		 * in preset.
		 *
		 * It will also rebuild the preset styles on page to
		 * ensure the values are up to date.
		 */
		_recalculate_indents: function () {
			var left = parseInt(this.model.get("left_indent"), 10),
				right = parseInt(this.model.get("right_indent"), 10),
				base = parseInt(Upfront.Settings.LayoutEditor.Grid.column_width, 10)
			;
			this.model.set("calculated_left_indent", left * base);
			this.model.set("calculated_right_indent", right * base);

			// Also re-build presets for post data element
			// This is so the preset content paddings propagate properly on pad change
			Util.generatePresetsToPage('post_data_element', template);
		},
		
		/**
		 * Normalizes both content padding values
		 *
		 * Used because numeric input has zero validation on its own.
		 * Updates corresponding preset properties as a side-effect
		 *
		 * @param {String} type Padding type (left or right)
		 * @param {Integer} value New value to validate
		 *
		 * @return {Boolean}
		 */
		_normalize_padding: function (type, value) {
			if (!(this._padding_fields || {})[type]) return false;
			value = parseInt(value, 10) || -1;
			var field = this._padding_fields[type] || {},
				grid_size = Upfront.Settings.LayoutEditor.Grid.size || 24,
				half_grid = parseInt((grid_size-1)/2),
				options = field.options || {},
				min = parseInt(options.min, 10) || 0,
				max = parseInt(options.max, 10) || half_grid
			;
			if (value < min) {
				field.set_value(min);
				this.update_object(min, options.property)
			}
			if (value > max) {
				field.set_value(max);
				this.update_object(max, options.property)
			}

			return true;
		},
		normalize_left_padding: function (value) {
			return this._normalize_padding('left', value);
		},
		normalize_right_padding: function (value) {
			return this._normalize_padding('right', value);
		},
		get_modules: function () { return []; } // No extra modules for content
	});

	return Modules;
});