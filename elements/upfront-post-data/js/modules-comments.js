define([
	'elements/upfront-post-data/js/panel-abstractions',
	'text!elements/upfront-post-data/tpl/preset-styles/comments.html',
], function (Panel, template) {

	var Modules = {};
	Modules.template = template;
	
	Modules.part_comment_count = Panel.Toggleable.extend({ title: "Comment Count", data_part: 'comment_count' });
	Modules.part_comment_form = Panel.Toggleable.extend({ title: "Comments Form", data_part: 'comment_form' });
	
	Modules.part_comments_pagination = Panel.Toggleable.extend({
		title: "Comments Pagination",
		data_part: 'comments_pagination',
		get_fields: function () {
			var fields = [],
				post_specific = Upfront.data.upfront_post_data.post_data,
				paginated = parseInt((Upfront.data || {upfront_post_data_comments: {paginated: 0}}).upfront_post_data_comments.paginated, 10)
			;
			if (!paginated) {
				fields.push({
					type: "Button",
					className: 'comments-pagination_warning',
					label: "Comments pagination is disabled in admin. Toggling this part will have no effect.",
				});
			}
			return fields;
		}
	});
	
	Modules.part_comments = Panel.Toggleable.extend({
		title: "Comments",
		data_part: 'comments',
		get_fields: function () {
			var fields = [],
				post_specific = Upfront.data.upfront_post_data.post_data,
				comments = (post_specific || {comments: {}}).comments,
				disabled = (comments || {disable: []}).disable,
				paginated = parseInt((Upfront.data || {upfront_post_data_comments: {paginated: 0}}).upfront_post_data_comments.paginated, 10)
			;
			fields = [
				{
					type: 'Checkboxes',
					property: 'disable',
					label: "For this post:",
					values: [
						{label: 'Disable comments', value: 'comments'},
						{label: 'Disable trackbacks', value: 'trackbacks'}
					]
				},
				{
					type: 'Checkboxes',
					property: "disable_showing",
					label: "Do not show:",
					values: [
						{label: 'Comments', value: 'comments'},
						{label: 'Trackbacks', value: 'trackbacks'}
					]
				}
			];
			if (!!paginated) {
				// Pagination
				fields.push({
					type: 'Number',
					property: "limit",
					label: 'Comments per page'
				});
			}
			fields.push({
				type: 'Radios',
				property: "order",
				label: "Order by:",
				values: [
					{label: 'Date', value: 'comment_date_gmt'},
					{label: 'Karma', value: 'comment_karma'},
					{label: 'Parent', value: 'comment_parent'},
				]
			})
			fields.push({
				type: 'Radios',
				property: "direction",
				label: "Direction:",
				values: [
					{label: 'Oldest first', value: 'ASC'},
					{label: 'Newest first', value: 'DESC'},
				]
			});
			return fields;
		},
		render: function () {
			// Re-setup comments hidden parts *before* parent render
			// This is to toggle pagination part off if the paginated setting is off
			var paginated = parseInt((Upfront.data || {upfront_post_data_comments: {paginated: 0}}).upfront_post_data_comments.paginated, 10),
				hidden_parts = this.model.get("hidden_parts") || []
			;

			if (!paginated && hidden_parts.indexOf('comments_pagination') < 0) {
				hidden_parts.push('comments_pagination');
				this.model.set('hidden_parts', hidden_parts);
			}


			Panel.Toggleable.prototype.render.apply(this, arguments);
			
			// Let's start stuff up on first render if we're not already there
			if (!this._disable_field || !this._pagination_field) {
				var fields = this.fields.toArray();
				this._disable_field = fields[0];
				this._pagination_field = fields[2];
				
				if (this._disable_field) this.listenTo(this._disable_field, "changed", this.send_update_request);
			}

			// Safe to proceed as normal now
			//this.update_fields();
		},
		send_update_request: _.debounce(function () {
			var disabled = this._disable_field.get_value();
			Upfront.Util.post({
				action: 'upfront-post_data-comments-disable',
				post_id: _upfront_post_data.post_id,
				disable: disabled
			});
		}, 3000)
	});

// Let's go with loading up the post-specific settings right away
Upfront.data.upfront_post_data.post_data = {}; // Set up the defaults
Upfront.Util.post({
	action: 'upfront-post_data-post-specific',
	post_id: _upfront_post_data.post_id
}).done(function (response) {
	Upfront.data.upfront_post_data.post_data = "data" in response
		? response.data
		: {}
	;
});

	return Modules;
});