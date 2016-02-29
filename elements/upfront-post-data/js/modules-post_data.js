define([
	'elements/upfront-post-data/js/panel-abstractions',
	'text!elements/upfront-post-data/tpl/preset-styles/post_data.html',
], function (Panel, template) {

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
			return [
				{
					type: "Number",
					label: "Limit words",
					label_style: 'inline',
					property: "content_length"
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
				this._allow_splitting_field = fields[1];
				this._content_part_field = fields[2];
				
				if (this._allow_splitting_field) this.listenTo(this._allow_splitting_field, "changed", this.update_fields);
			}

			// Safe to proceed as normal now
			this.update_fields();
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
		get_modules: function () { return []; } // No extra modules for content
	});

	return Modules;
});