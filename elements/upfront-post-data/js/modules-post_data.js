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
			return [{
				type: "Text",
				label: "Format",
				label_style: 'inline',
				property: "date_posted_format"
			}];
		},
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